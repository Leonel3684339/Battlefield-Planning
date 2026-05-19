import requests
import numpy as np
from typing import Tuple, Optional, Dict
import time
from PIL import Image
import io
import os
import hashlib
import pickle
from scipy.ndimage import zoom

# Import landcover functions
from .landcover import get_landcover_for_bounds, compute_mobility_impedance, classify_terrain_by_passability
# Import OSM feature functions
from .osm_features import load_local_osm_features, rasterize_features
# Import local DEM reader
from .dem_reader import get_elevation_grid_local

# Permanent terrain cache directory
TERRAIN_CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'terrain_cache')
os.makedirs(TERRAIN_CACHE_DIR, exist_ok=True)

# Temporary cache for elevation data
ELEVATION_CACHE: Dict[str, Tuple[float, np.ndarray]] = {}
CACHE_DURATION = 3600

# Resolution for terrain analysis (higher = more detail, slower)
ANALYSIS_GRID_SIZE = 256

def _cache_key(bounds: Tuple[float, float, float, float]) -> str:
    return f"{bounds[0]:.4f},{bounds[1]:.4f},{bounds[2]:.4f},{bounds[3]:.4f}"

def _terrain_cache_key(bounds: Tuple[float, float, float, float], grid_size: int) -> str:
    south = round(bounds[0], 2)
    west = round(bounds[1], 2)
    north = round(bounds[2], 2)
    east = round(bounds[3], 2)
    key_str = f"{south}_{west}_{north}_{east}_{grid_size}"
    return hashlib.md5(key_str.encode()).hexdigest()

def _save_terrain_to_cache(key: str, data: dict):
    cache_file = os.path.join(TERRAIN_CACHE_DIR, f"{key}.pkl")
    try:
        with open(cache_file, 'wb') as f:
            pickle.dump(data, f)
        print(f"💾 Cached terrain data to {cache_file}")
    except Exception as e:
        print(f"⚠️ Failed to cache terrain: {e}")

def _load_terrain_from_cache(key: str) -> Optional[dict]:
    cache_file = os.path.join(TERRAIN_CACHE_DIR, f"{key}.pkl")
    if os.path.exists(cache_file):
        try:
            with open(cache_file, 'rb') as f:
                data = pickle.load(f)
            print(f"✅ Loaded terrain from cache: {cache_file}")
            return data
        except Exception as e:
            print(f"⚠️ Failed to load cache: {e}")
    return None

def get_elevation_grid(
    bounds: Tuple[float, float, float, float],
    grid_size: int = ANALYSIS_GRID_SIZE
) -> Optional[np.ndarray]:
    key = _cache_key(bounds)
    if key in ELEVATION_CACHE:
        ts, data = ELEVATION_CACHE[key]
        if time.time() - ts < CACHE_DURATION:
            print("Using cached elevation data")
            return data
        else:
            del ELEVATION_CACHE[key]

    try:
        elev = get_elevation_grid_local(bounds, grid_size)
        if elev is not None:
            print("✅ Using local DEM")
            ELEVATION_CACHE[key] = (time.time(), elev)
            return elev
    except Exception as e:
        print(f"⚠️ Local DEM extraction failed: {e}")

    print("🌍 Falling back to Open-Elevation API")
    south, west, north, east = bounds
    lats = np.linspace(south, north, grid_size)
    lngs = np.linspace(west, east, grid_size)

    locations = []
    for lat in lats:
        for lng in lngs:
            locations.append(f"{lat},{lng}")

    chunk_size = 100
    url = "https://api.opentopodata.org/v1/test-dataset"
    all_elevations = []

    for i in range(0, len(locations), chunk_size):
        chunk = locations[i:i+chunk_size]
        params = {'locations': '|'.join(chunk)}
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            if 'results' in data:
                for res in data['results']:
                    all_elevations.append(res['elevation'])
            else:
                print("Warning: No results in elevation response")
                return None
        except Exception as e:
            print(f"Elevation fetch failed: {e}")
            return None

    if len(all_elevations) == grid_size * grid_size:
        elev_grid = np.array(all_elevations).reshape(grid_size, grid_size)
        ELEVATION_CACHE[key] = (time.time(), elev_grid)
        return elev_grid
    else:
        print("Elevation data incomplete")
        return None

def compute_slope(elev_grid: np.ndarray, cell_size_m: float = 100) -> np.ndarray:
    # Replace extreme NoData values (e.g., < -1000) with NaN
    elev_clean = np.where(elev_grid < -1000, np.nan, elev_grid)
    gy, gx = np.gradient(elev_clean, cell_size_m)
    # Clip gradients to prevent overflow
    max_grad = 1e4
    gx = np.clip(gx, -max_grad, max_grad)
    gy = np.clip(gy, -max_grad, max_grad)
    slope = np.arctan(np.sqrt(gx**2 + gy**2)) * 180 / np.pi
    # Set slope to 0 where elevation was NaN
    slope = np.where(np.isnan(elev_clean), 0, slope)
    return slope

def compute_aspect(elev_grid: np.ndarray, cell_size_m: float = 100) -> np.ndarray:
    gy, gx = np.gradient(elev_grid, cell_size_m)
    aspect = np.arctan2(-gx, gy) * 180 / np.pi
    aspect = (aspect + 360) % 360
    return aspect

def classify_slope(slope_deg: np.ndarray) -> np.ndarray:
    categories = np.empty(slope_deg.shape, dtype='<U8')
    categories[slope_deg < 5] = 'flat'
    categories[(slope_deg >= 5) & (slope_deg < 15)] = 'moderate'
    categories[slope_deg >= 15] = 'steep'
    return categories

def get_terrain_features(
    bounds: Tuple[float, float, float, float],
    grid_size: int = ANALYSIS_GRID_SIZE
) -> Optional[Dict]:
    elev = get_elevation_grid(bounds, grid_size)
    if elev is None:
        return None

    south, west, north, east = bounds
    lat_span = north - south
    lng_span = east - west
    cell_size_lat = lat_span * 111000 / grid_size
    cell_size_lng = lng_span * 111000 * np.cos(np.radians((south+north)/2)) / grid_size
    cell_size_m = (cell_size_lat + cell_size_lng) / 2

    slope = compute_slope(elev, cell_size_m)
    aspect = compute_aspect(elev, cell_size_m)
    slope_class = classify_slope(slope)

    return {
        'elevation': elev,
        'slope': slope,
        'aspect': aspect,
        'slope_class': slope_class,
        'cell_size': cell_size_m
    }

def _resize_array(arr: np.ndarray, target_shape: Tuple[int, int]) -> np.ndarray:
    h, w = arr.shape
    target_h, target_w = target_shape
    row_indices = (np.arange(target_h) * h / target_h).astype(int)
    col_indices = (np.arange(target_w) * w / target_w).astype(int)
    return arr[row_indices][:, col_indices]


def get_landcover_impedance(bounds: Tuple[float, float, float, float], grid_size: int = 20) -> Optional[np.ndarray]:
    from config import LANDCOVER_PATH, LANDCOVER_MAPPING
    import rasterio
    from rasterio.windows import from_bounds
    from pyproj import Transformer

    try:
        with rasterio.open(LANDCOVER_PATH) as src:
            transformer = Transformer.from_crs("EPSG:4326", src.crs, always_xy=True)
            xmin, ymin = transformer.transform(bounds[1], bounds[0])
            xmax, ymax = transformer.transform(bounds[3], bounds[2])
            window = from_bounds(xmin, ymin, xmax, ymax, src.transform)
            row_start = max(0, int(round(window.row_off)))
            row_stop = min(src.shape[0], row_start + int(round(window.height)))
            col_start = max(0, int(round(window.col_off)))
            col_stop = min(src.shape[1], col_start + int(round(window.width)))
            if row_stop <= row_start or col_stop <= col_start:
                return np.zeros((grid_size, grid_size), dtype=np.float32)

            data = src.read(1, window=((row_start, row_stop), (col_start, col_stop)))
            mapped = np.zeros_like(data, dtype=np.float32)
            for code, imp in LANDCOVER_MAPPING.items():
                mapped[data == code] = imp
            data = mapped

            if data.shape[0] != grid_size or data.shape[1] != grid_size:
                zoom_factors = (grid_size / data.shape[0], grid_size / data.shape[1])
                data = zoom(data, zoom_factors, order=1)
            return data
    except Exception as e:
        print(f"⚠️ Error loading LandCover raster: {e}")
        return None

def get_complete_terrain_analysis(
    bounds: Tuple[float, float, float, float],
    grid_size: int = 256,
    use_osm: bool = True
) -> Optional[Dict]:
    cache_key = _terrain_cache_key(bounds, grid_size)
    cached = _load_terrain_from_cache(cache_key)
    if cached is not None:
        return cached

    print(f"🔄 Cache miss – processing terrain for bounds {bounds} (use_osm={use_osm})")

    # Get terrain features (elevation, slope) at analysis resolution
    terrain = get_terrain_features(bounds, grid_size=ANALYSIS_GRID_SIZE)
    if terrain is None:
        return None

    # --- Land cover (primary source: LandCover raster) ---
    lc_impedance = get_landcover_impedance(bounds, 20)
    if lc_impedance is not None:
        base_impedance = compute_mobility_impedance(lc_impedance, terrain['slope'])
        lc_grid = None
        lc_resampled = None
        print("✅ Using LandCover raster as primary land cover")
    else:
        print("⚠️ Using synthetic land cover (fallback)")
        lc_grid = get_landcover_for_bounds(bounds, grid_size=grid_size)
        if lc_grid is None:
            from .landcover import generate_synthetic_landcover
            lc_grid = generate_synthetic_landcover(bounds, grid_size)
        zoom_factor = 20 / grid_size
        lc_resampled = zoom(lc_grid, zoom_factor, order=0)
        base_impedance = compute_mobility_impedance(lc_resampled, terrain['slope'])

    final_impedance = base_impedance.copy()

    # --- OSM features (optional) ---
    if use_osm:
        try:
            features = load_local_osm_features(bounds)
            if features:
                osm_delta = rasterize_features(features, bounds, ANALYSIS_GRID_SIZE, influence_radius_m=50)
                final_impedance += osm_delta
                print(f"✅ Integrated {len(features)} OSM features")
            else:
                print("ℹ️ No OSM features found")
        except Exception as e:
            print(f"⚠️ OSM integration failed: {e}")
    else:
        print("ℹ️ Skipping OSM features (fast mode)")

    # --- Custom GIS layers (soil, trails) ---
    try:
        from .gis_features import load_gis_delta
        gis_delta, boundary_mask = load_gis_delta(bounds, ANALYSIS_GRID_SIZE)
        final_impedance += gis_delta
        if boundary_mask is not None:
            final_impedance[~boundary_mask] = 1.0
            print("✅ Applied training area boundary mask")
        print("✅ Integrated GIS layers")
    except ImportError as e:
        print(f"⚠️ GIS features module import error: {e}")
    except Exception as e:
        print(f"⚠️ GIS integration failed: {e}")

    # Clamp final impedance to [0,1]
    final_impedance = np.clip(final_impedance, 0.0, 1.0)

    # Classify mobility
    go_grid, mobility_stats = classify_terrain_by_passability(final_impedance)

    result = {
        'elevation': terrain['elevation'],
        'slope': terrain['slope'],
        'aspect': terrain['aspect'],
        'slope_class': terrain['slope_class'],
        'cell_size': terrain['cell_size'],
        'landcover_raw': lc_grid,
        'landcover': lc_resampled,
        'base_impedance': base_impedance,
        'impedance': final_impedance,
        'mobility_class': go_grid,
        'mobility_stats': mobility_stats
    }

    _save_terrain_to_cache(cache_key, result)
    return result

def generate_mobility_image(terrain: dict, width: int = 256, height: int = 256) -> bytes:
    mobility = terrain['mobility_class']
    resized = _resize_array(mobility, (height, width))
    color_map = {
        'GO': (0, 255, 0, 255),
        'SLOW GO': (255, 255, 0, 255),
        'NO GO': (255, 0, 0, 255),
    }
    img = Image.new('RGBA', (width, height))
    for y in range(height):
        for x in range(width):
            cls = resized[y, x]
            img.putpixel((x, y), color_map.get(cls, (0, 0, 0, 0)))
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return buf.getvalue()