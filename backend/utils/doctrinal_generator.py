import os
import random
import math
import heapq
from typing import List, Dict, Optional, Tuple
import numpy as np
from shapely.geometry import Point, Polygon, shape
from matplotlib.path import Path
from scipy.ndimage import zoom
import rasterio
from rasterio.windows import from_bounds
from pyproj import Transformer
from .terrain import get_complete_terrain_analysis
from .obstacle_generator import obstacle_types
from .osm_features import get_building_mask
from config import GIS_DATA_DIR



# ------------------------------------------------------------
# Helper: enemy corridor (cone)
# ------------------------------------------------------------
def create_enemy_corridor(
    bounds: Tuple[float, float, float, float],
    enemy_pos: Tuple[float, float],
    direction_deg: float,
    speed_kmh: float,
    grid_size: int,
    time_horizon: float = 5.0
) -> np.ndarray:
    south, west, north, east = bounds
    enemy_lat, enemy_lng = enemy_pos
    direction_rad = math.radians(direction_deg)
    distance_km = speed_kmh * (time_horizon / 60)
    lat_per_km = 1 / 111.0
    lng_per_km = 1 / (111.0 * math.cos(math.radians(enemy_lat)))

    end_lat = enemy_lat + distance_km * lat_per_km * math.cos(direction_rad)
    end_lng = enemy_lng + distance_km * lng_per_km * math.sin(direction_rad)
    cone_angle = math.radians(15)
    left_dir = direction_rad - cone_angle
    right_dir = direction_rad + cone_angle
    left_end_lat = enemy_lat + distance_km * lat_per_km * math.cos(left_dir)
    left_end_lng = enemy_lng + distance_km * lng_per_km * math.sin(left_dir)
    right_end_lat = enemy_lat + distance_km * lat_per_km * math.cos(right_dir)
    right_end_lng = enemy_lng + distance_km * lng_per_km * math.sin(right_dir)

    corridor_poly = Polygon([
        (enemy_lng, enemy_lat),
        (left_end_lng, left_end_lat),
        (right_end_lng, right_end_lat)
    ])

    xs = np.linspace(west, east, grid_size)
    ys = np.linspace(south, north, grid_size)
    corridor_mask = np.zeros((grid_size, grid_size))
    for i, y in enumerate(ys):
        for j, x in enumerate(xs):
            if corridor_poly.contains(Point(x, y)):
                corridor_mask[i, j] = 1.0
    return corridor_mask

# ------------------------------------------------------------
# Helper: trail mask
# ------------------------------------------------------------
def get_trail_mask(bounds: Tuple[float, float, float, float], grid_size: int) -> np.ndarray:
    """Return a binary mask where 1 indicates tank or rat trail cells."""
    trail_mask = np.zeros((grid_size, grid_size), dtype=np.float32)
    trail_files = ['Tank_Trails.tif', 'Rat_Trails.tif']
    for file in trail_files:
        path = os.path.join(GIS_DATA_DIR, file)
        if not os.path.exists(path):
            continue
        try:
            with rasterio.open(path) as src:
                transformer = Transformer.from_crs("EPSG:4326", src.crs, always_xy=True)
                xmin, ymin = transformer.transform(bounds[1], bounds[0])
                xmax, ymax = transformer.transform(bounds[3], bounds[2])
                window = from_bounds(xmin, ymin, xmax, ymax, src.transform)
                row_start = max(0, int(round(window.row_off)))
                row_stop = min(src.shape[0], row_start + int(round(window.height)))
                col_start = max(0, int(round(window.col_off)))
                col_stop = min(src.shape[1], col_start + int(round(window.width)))
                if row_stop <= row_start or col_stop <= col_start:
                    continue
                data = src.read(1, window=((row_start, row_stop), (col_start, col_stop)))
                if data.shape[0] != grid_size or data.shape[1] != grid_size:
                    zoom_factors = (grid_size / data.shape[0], grid_size / data.shape[1])
                    data = zoom(data, zoom_factors, order=0)
                trail_mask[data != 0] = 1.0
        except Exception as e:
            print(f"Warning: could not load {file}: {e}")
    return trail_mask

# ------------------------------------------------------------
# Helper: forest mask from landcover (class 5 = dense vegetation)
# ------------------------------------------------------------
def get_forest_mask(landcover_grid: np.ndarray, grid_size: int) -> np.ndarray:
    """
    Return binary mask where 1 indicates forest (class 5) cells.
    Based on LandCover.tif class codes from config.py: 5 = forest.
    """
    if landcover_grid is None:
        print("No landcover grid provided, forest mask = zeros")
        return np.zeros((grid_size, grid_size), dtype=np.float32)
    # landcover_grid is typically 20x20; resize to grid_size
    if landcover_grid.shape[0] != grid_size:
        from scipy.ndimage import zoom
        zoom_factor = grid_size / landcover_grid.shape[0]
        landcover_resized = zoom(landcover_grid, zoom_factor, order=0)
    else:
        landcover_resized = landcover_grid
    # Forest class = 5
    forest_mask = (landcover_resized == 5).astype(np.float32)
    forest_count = np.sum(forest_mask)
    total_cells = grid_size * grid_size
    print(f"Forest cells: {forest_count} / {total_cells} ({forest_count/total_cells*100:.1f}%)")
    return forest_mask

# ------------------------------------------------------------
# Helper: polygon mask from GeoJSON
# ------------------------------------------------------------
def get_polygon_mask(bounds: Tuple[float, float, float, float],
                     polygon_geojson: dict,
                     grid_size: int) -> np.ndarray:
    """Return a boolean mask (True inside polygon) for the grid."""
    south, west, north, east = bounds
    xs = np.linspace(west, east, grid_size)
    ys = np.linspace(south, north, grid_size)
    points = np.array([(x, y) for y in ys for x in xs])
    try:
        coords = polygon_geojson['coordinates'][0]   # list of [lng, lat]
        path = Path(coords)
        inside = path.contains_points(points).reshape(grid_size, grid_size)
        return inside
    except Exception as e:
        print(f"Polygon mask error: {e}")
        return np.ones((grid_size, grid_size), dtype=bool)

# ------------------------------------------------------------
# Obstacle selection based on doctrine
# ------------------------------------------------------------
def select_obstacle_for_target(
    target: str,
    effect: str,
    mobility: str,
    avoid_mines: bool,
    time: str,
    prefer_mines: bool = False
) -> tuple:
    candidates = []
    if target == 'armor':
        if mobility == 'GO':
            candidates = [('OBBT', 'Tank Ditch', 150)]
            if not avoid_mines and prefer_mines:
                candidates.append(('OMT', 'AT Mine (General)', 100))
        elif mobility == 'SLOW GO':
            candidates = [('OBB', 'Barrier (General)', 50)]
            if not avoid_mines and prefer_mines:
                candidates.append(('OMT', 'AT Mine (General)', 100))
        else:
            candidates = [('OBT', 'Turn Obstacle', 0)]
    elif target == 'mechanized infantry':
        if mobility == 'GO':
            candidates = [('OBBT', 'Tank Ditch', 150)]
            if not avoid_mines and prefer_mines:
                candidates.append(('OMT', 'AT Mine (General)', 100))
                candidates.append(('OMP', 'AP Mine (General)', 100))
        elif mobility == 'SLOW GO':
            candidates = [('OBWL', 'Low Wire Fence', 50)]
            if not avoid_mines and prefer_mines:
                candidates.append(('OMP', 'AP Mine (General)', 100))
        else:
            candidates = [('OBW', 'Wire Obstacle (General)', 50)]
    elif target == 'dismounted infantry':
        if mobility in ('GO', 'SLOW GO'):
            candidates = [('OBWL', 'Low Wire Fence', 50)]
            if not avoid_mines and prefer_mines:
                candidates.append(('OMP', 'AP Mine (General)', 100))
                candidates.append(('OMPD', 'AP Directional (Claymore)', 60))
        else:
            candidates = [('OBW', 'Wire Obstacle (General)', 50)]
    elif target == 'reconnaissance':
        candidates = [('OBW', 'Wire Obstacle (General)', 50)]
        if not avoid_mines and prefer_mines:
            candidates.append(('OMPD', 'AP Directional (Claymore)', 60))
    else:
        candidates = [('OBB', 'Barrier (General)', 50), ('OBT', 'Turn Obstacle', 0)]

    if not candidates:
        candidates = [('OBB', 'Barrier (General)', 50)]

    if time == 'limited':
        expedient = [c for c in candidates if 'Wire' in c[1] or 'Barrier' in c[1] or 'General' in c[1]]
        if expedient:
            return random.choice(expedient)

    if effect == 'block':
        candidates.sort(key=lambda x: x[2], reverse=True)
        return random.choice(candidates[:2])
    elif effect == 'disrupt':
        candidates.sort(key=lambda x: x[2])
    return random.choice(candidates)

# ------------------------------------------------------------
# Terrain suitability with land cover and target
# ------------------------------------------------------------
def terrain_suitability_for_obstacle(
    obstacle_code: str,
    impedance: float,
    slope: float,
    landcover_class: int = None,
    target: str = None
) -> float:
    if obstacle_code in ['OBBT']:
        imp_score = 1.0 - impedance
        slope_score = 1.0 - np.clip(slope / 15.0, 0, 1)
        base = imp_score * slope_score
    elif obstacle_code.startswith('OBW'):
        imp_score = 1.0 - np.abs(impedance - 0.45) / 0.45
        slope_score = 1.0 - np.abs(slope - 10.0) / 10.0
        base = np.clip(imp_score, 0, 1) * np.clip(slope_score, 0, 1)
    elif obstacle_code.startswith('OM'):
        imp_score = 1.0 - impedance
        slope_score = 1.0 - np.clip(slope / 10.0, 0, 1)
        base = imp_score * slope_score
    else:
        imp_score = 1.0 - np.abs(impedance - 0.35) / 0.35
        base = np.clip(imp_score, 0, 1)

    if landcover_class is not None:
        if landcover_class in (6, 7):
            base *= 0.01
        elif obstacle_code in ['OBBT']:
            if landcover_class in (1, 2):
                base *= 1.2
            elif landcover_class in (5, 6, 7):
                base *= 0.5
        elif obstacle_code.startswith('OBW'):
            if landcover_class in (3, 5):
                base *= 1.2
            elif landcover_class in (1, 2):
                base *= 0.8
        elif obstacle_code.startswith('OM'):
            if landcover_class in (6, 7):
                base *= 0.3
            elif landcover_class in (5):
                base *= 0.7
        else:
            if landcover_class in (1, 2):
                base *= 0.7

    if target == 'armor':
        if obstacle_code in ['OBBT', 'OMT']:
            base *= 1.2
        elif obstacle_code.startswith('OBW'):
            base *= 0.5
    elif target == 'dismounted infantry':
        if obstacle_code.startswith('OBW') or obstacle_code.startswith('OMP'):
            base *= 1.2
        elif obstacle_code in ['OBBT']:
            base *= 0.3
    elif target == 'mechanized infantry':
        if obstacle_code.startswith('OM'):
            base *= 1.0
        elif obstacle_code in ['OBBT']:
            base *= 1.0
        else:
            base *= 0.8

    return np.clip(base, 0, 1)

# ------------------------------------------------------------
# Pathfinding utilities
# ------------------------------------------------------------
def least_cost_path(impedance_grid, start, goal):
    rows, cols = impedance_grid.shape
    dist = np.full((rows, cols), np.inf)
    dist[start[0], start[1]] = 0
    prev = {}
    pq = [(0, start)]
    while pq:
        d, (r, c) = heapq.heappop(pq)
        if (r, c) == goal:
            break
        if d > dist[r, c]:
            continue
        for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
            nr, nc = r+dr, c+dc
            if 0 <= nr < rows and 0 <= nc < cols:
                nd = d + impedance_grid[nr, nc]
                if nd < dist[nr, nc]:
                    dist[nr, nc] = nd
                    heapq.heappush(pq, (nd, (nr, nc)))
                    prev[(nr, nc)] = (r, c)
    path = []
    cur = goal
    while cur in prev:
        path.append(cur)
        cur = prev[cur]
    path.append(start)
    path.reverse()
    return path if path[0] == start else []

def path_probability_mask(path, grid_size, radius_meters, cell_size_m):
    radius_cells = int(radius_meters / cell_size_m) + 1
    mask = np.zeros((grid_size, grid_size), dtype=np.float32)
    for (r, c) in path:
        for dr in range(-radius_cells, radius_cells+1):
            for dc in range(-radius_cells, radius_cells+1):
                nr, nc = r+dr, c+dc
                if 0 <= nr < grid_size and 0 <= nc < grid_size:
                    mask[nr, nc] = 1.0
    return mask

# ------------------------------------------------------------
# Main generation function
# ------------------------------------------------------------
def generate_doctrinal_obstacles(
    bounds: Optional[Tuple[float, float, float, float]],
    target: str,
    effect: str,
    relative_location: str,
    mett_tc: dict,
    intensity: float,
    correlation: float,
    model: str,
    path: Optional[List[Tuple[float, float]]] = None,
    enemy_position: Optional[Tuple[float, float]] = None,
    enemy_direction: Optional[float] = None,
    enemy_speed: Optional[float] = None,
    objective: Optional[Tuple[float, float]] = None,
    polygon: Optional[dict] = None
) -> Tuple[List[Dict], Optional[List[Tuple[float, float]]]]:
    print(f"Generating obstacles with doctrinal params: target={target}, effect={effect}")
    mission = mett_tc.get('mission', 'defend')
    troops = mett_tc.get('troops', 'company')
    time = mett_tc.get('time', 'limited')
    civil = mett_tc.get('civil', 'none')
    avoid_mines = (civil != 'none')

    time_multiplier = 0.7 if time == 'limited' else 1.3
    troop_multiplier = {'platoon':0.6, 'company':1.0, 'battalion':1.5}.get(troops, 1.0)

    if bounds is None:
        from .obstacle_generator import generate_obstacles
        return generate_obstacles(intensity, correlation, model, bounds), None

    terrain = get_complete_terrain_analysis(bounds, grid_size=256)
    if terrain is None:
        from .obstacle_generator import generate_obstacles
        return generate_obstacles(intensity, correlation, model, bounds), None

    impedance = terrain['impedance']
    slope = terrain['slope']
    mobility_class = terrain['mobility_class']
    landcover = terrain.get('landcover')
    stats = terrain.get('mobility_stats', {})
    print(f"Terrain mobility: GO={stats.get('GO',0):.1f}%, SLOW GO={stats.get('SLOW GO',0):.1f}%, NO GO={stats.get('NO GO',0):.1f}%")

    south, west, north, east = bounds
    grid_size = impedance.shape[0]

    lat_span = north - south
    lng_span = east - west
    cell_size_lat = lat_span * 111000 / grid_size
    cell_size_lng = lng_span * 111000 * math.cos((south+north)*math.pi/360) / grid_size
    cell_size_m = (cell_size_lat + cell_size_lng) / 2

    # Get building mask
    try:
        building_mask = get_building_mask(bounds, grid_size)
        print(f"Building mask: {np.sum(building_mask)} cells marked as buildings")
    except Exception as e:
        print(f"Could not get building mask: {e}")
        building_mask = np.zeros((grid_size, grid_size), dtype=bool)

    # --- Enemy probability mask (corridor + path) ---
    enemy_prob = None
    path_coords = None
    if enemy_position and enemy_direction is not None and enemy_speed is not None:
        corridor = create_enemy_corridor(bounds, enemy_position, enemy_direction, enemy_speed, grid_size)
        if objective is not None:
            def lat_to_idx(lat): return max(0, min(grid_size-1, int((lat - south) / lat_span * grid_size)))
            def lng_to_idx(lng): return max(0, min(grid_size-1, int((lng - west) / lng_span * grid_size)))
            start_row, start_col = lat_to_idx(enemy_position[0]), lng_to_idx(enemy_position[1])
            goal_row, goal_col = lat_to_idx(objective[0]), lng_to_idx(objective[1])
            print(f"Pathfinding from enemy ({start_row},{start_col}) to objective ({goal_row},{goal_col})")
            path_cost_grid = impedance.copy()
            path_cost_grid[building_mask] = 1.0
            path_cells = least_cost_path(path_cost_grid, (start_row, start_col), (goal_row, goal_col))
            if path_cells:
                print(f"Path found with {len(path_cells)} cells")
                path_coords = []
                for (r, c) in path_cells:
                    lat = south + (r + 0.5) * lat_span / grid_size
                    lng = west + (c + 0.5) * lng_span / grid_size
                    path_coords.append([lat, lng])
                path_prob = path_probability_mask(path_cells, grid_size, radius_meters=100, cell_size_m=cell_size_m)
                enemy_prob = np.maximum(corridor, path_prob)
            else:
                print("WARNING: No path found from enemy to objective. Using corridor only.")
                enemy_prob = corridor
        else:
            enemy_prob = corridor

    # --- Base weight grid ---
    weights = 1.0 - impedance
    weights[building_mask] = 0.0

    if enemy_prob is not None:
        if effect == 'block':
            weights *= (1 + enemy_prob * 2)
        elif effect == 'turn':
            weights *= (1 + enemy_prob * 0.5)
        elif effect == 'fix':
            weights *= (1 + enemy_prob)
        elif effect == 'disrupt':
            weights *= (1 + 0.5 * enemy_prob)

    # --- Trail boost ---
    try:
        trail_mask = get_trail_mask(bounds, grid_size)
        weights = weights * (1 + trail_mask * 2)
        print(f"Trail mask: {np.sum(trail_mask)} trail cells boosted")
    except Exception as e:
        print(f"Trail boost failed: {e}")

    # --- Forest boost (strong preference for dense vegetation) ---
    if landcover is not None:
        try:
            forest_mask = get_forest_mask(landcover, grid_size)
            # Boost weight by factor 5 on forest cells (1 + 4*1 = 5)
            weights = weights * (1 + forest_mask * 4.0)
            print(f"Forest boost applied (multiplier up to 5x)")
            forest_weight = weights[forest_mask > 0].sum()
            nonforest_weight = weights[forest_mask == 0].sum()
            print(f"Total weight on forest: {forest_weight:.2f}, non-forest: {nonforest_weight:.2f}")
        except Exception as e:
            print(f"Forest boost failed: {e}")
    else:
        print("WARNING: No landcover data – forest boost disabled")

    # --- Polygon mask (restrict to exact drawn area) ---
    if polygon is not None:
        try:
            polygon_mask = get_polygon_mask(bounds, polygon, grid_size)
            print(f"Polygon mask: inside={np.sum(polygon_mask)}, outside={np.sum(~polygon_mask)}")
            weights[~polygon_mask] = 0.0
        except Exception as e:
            print(f"Polygon mask failed: {e}")

    # Normalize
    flat_weights = weights.flatten()
    total = flat_weights.sum()
    if total == 0:
        
        print("No suitable terrain, falling back to random")
        from .obstacle_generator import generate_obstacles
        return generate_obstacles(intensity, correlation, model, bounds), None
    probs = flat_weights / total

    effect_multiplier = {'block':1.5, 'turn':1.2, 'fix':1.0, 'disrupt':0.8}.get(effect, 1.0)
    base_obstacles = int(intensity * 50 * effect_multiplier * troop_multiplier * time_multiplier)
    num_obstacles = base_obstacles + random.randint(15, 35)
    print(f"Targeting {num_obstacles} obstacles (base {base_obstacles} + random)")

    max_mines = int(num_obstacles * 0.3) if not avoid_mines else 0
    num_mines = 0

    obstacles = []
    min_dist_meters = 1000 * (1 - correlation)
    all_indices = [(i, j) for i in range(grid_size) for j in range(grid_size)]

    for i in range(num_obstacles):
        attempts = 0
        placed = False
        while not placed and attempts < 200:
            idx = np.random.choice(len(all_indices), p=probs)
            iy, ix = all_indices[idx]
            lat = south + (iy + 0.5) * lat_span / grid_size
            lng = west + (ix + 0.5) * lng_span / grid_size

            prefer_mines = (num_mines < max_mines and effect == 'block' and not avoid_mines)
            code, name, default_radius = select_obstacle_for_target(
                target, effect, mobility_class[iy, ix], avoid_mines, time, prefer_mines
            )
            radius = default_radius or random.randint(50, 250)

            lc_class = None
            if landcover is not None:
                lc_row = int(iy * 20 / grid_size)
                lc_col = int(ix * 20 / grid_size)
                lc_class = landcover[lc_row, lc_col] if 0 <= lc_row < 20 and 0 <= lc_col < 20 else None
            suitability = terrain_suitability_for_obstacle(
                code, impedance[iy, ix], slope[iy, ix], lc_class, target
            )
            if random.random() > suitability:
                attempts += 1
                continue

            if model == 'strauss':
                too_close = False
                for o in obstacles:
                    dx = (o['lng'] - lng) * 111000 * math.cos((o['lat']+lat)*math.pi/360)
                    dy = (o['lat'] - lat) * 111000
                    if math.hypot(dx, dy) < min_dist_meters:
                        too_close = True
                        break
                if too_close:
                    attempts += 1
                    continue

            obstacles.append({
                'id': f"ai-{i}-{random.randint(1000,9999)}",
                'lat': lat,
                'lng': lng,
                'radius': radius,
                'typeCode': code,
                'typeName': name,
            })
            placed = True
            if code.startswith('OM'):
                num_mines += 1

            # Density penalty
            radius_cells = int(radius / cell_size_m) + 1
            for di in range(-radius_cells, radius_cells+1):
                for dj in range(-radius_cells, radius_cells+1):
                    ni, nj = iy+di, ix+dj
                    if 0 <= ni < grid_size and 0 <= nj < grid_size:
                        weights[ni, nj] *= 0.5
            total = weights.sum()
            if total > 0:
                probs = weights.flatten() / total
            attempts += 1

        if not placed:
            print(f"Fallback placement for obstacle {i}")
            valid_fallback = ~building_mask
            if polygon is not None:
                valid_fallback = valid_fallback & polygon_mask
            valid_indices = np.where(valid_fallback)
            if len(valid_indices[0]) > 0:
                idx = random.randint(0, len(valid_indices[0])-1)
                iy = valid_indices[0][idx]
                ix = valid_indices[1][idx]
                lat = south + (iy + 0.5) * lat_span / grid_size
                lng = west + (ix + 0.5) * lng_span / grid_size
                code, name, default_radius = select_obstacle_for_target(
                    target, effect, mobility_class[iy, ix], avoid_mines, time, prefer_mines=False
                )
                radius = default_radius or random.randint(50, 250)
                obstacles.append({
                    'id': f"fallback-{i}-{random.randint(1000,9999)}",
                    'lat': lat,
                    'lng': lng,
                    'radius': radius,
                    'typeCode': code,
                    'typeName': name,
                   
                })
                if code.startswith('OM'):
                    num_mines += 1
                    
            else:
                print("ERROR: No valid fallback cells inside polygon!")

    print(f"Generated {len(obstacles)} obstacles (mines: {num_mines})")
    return obstacles, path_coords