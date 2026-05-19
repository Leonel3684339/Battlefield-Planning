import os
import pickle
import hashlib
import time
import logging
from typing import List, Dict, Tuple, Optional
import numpy as np
import geopandas as gpd
import pandas as pd
from shapely.geometry import Point, LineString, Polygon, shape, box
from shapely.errors import TopologicalError
import math
from matplotlib.path import Path

# Hardcoded path to your local OSM PBF file (Germany)
OSM_PBF_PATH = r"E:\Army Good File\Army\backend\bayern-260309.osm.pbf"

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Cache directory for extracted features
CACHE_DIR = 'cache'
os.makedirs(CACHE_DIR, exist_ok=True)

# Mapping of OSM tags to impedance modifiers
FEATURE_IMPEDANCE = {
    'water': 1.0,
    'river': 1.0,
    'stream': 0.8,
    'canal': 1.0,
    'drain': 0.5,
    'building': 0.9,
    'forest': 0.5,
    'wood': 0.5,
    'scrub': 0.4,
    'meadow': 0.2,
    'residential': 0.6,
    'commercial': 0.6,
    'industrial': 0.6,
    'retail': 0.5,
    'town': 0.6,
    'village': 0.5,
    'hamlet': 0.4,
    'drop_zone': -0.2,
    'barracks': 0.3,
    'military': 0.3,
    'range': 0.4,
    'motorway': -0.5,
    'trunk': -0.5,
    'primary': -0.4,
    'secondary': -0.3,
    'tertiary': -0.2,
    'unclassified': -0.1,
    'residential_road': -0.1,
    'track': -0.1,
    'path': 0.0,
    'footway': 0.0,
    'cycleway': 0.0,
    'bridleway': 0.0,
    'rail': 0.4,
    'power_line': 0.2,
    'bridge': -0.3,
}

def _cache_key(bounds: Tuple[float, float, float, float]) -> str:
    key = f"{bounds[0]:.4f},{bounds[1]:.4f},{bounds[2]:.4f},{bounds[3]:.4f}"
    return hashlib.md5(key.encode()).hexdigest()

def _load_cached_features(key: str):
    cache_file = os.path.join(CACHE_DIR, f"{key}.pkl")
    if not os.path.exists(cache_file):
        return None
    try:
        file_time = os.path.getmtime(cache_file)
        if time.time() - file_time > 86400:
            logger.info("Cache expired, removing")
            os.remove(cache_file)
            return None
        with open(cache_file, 'rb') as f:
            data = pickle.load(f)
        logger.info(f"Loaded {len(data)} features from cache")
        return data
    except Exception as e:
        logger.error(f"Failed to load cache: {e}")
        try:
            os.remove(cache_file)
        except:
            pass
        return None

def _save_features_to_cache(key: str, features):
    cache_file = os.path.join(CACHE_DIR, f"{key}.pkl")
    try:
        with open(cache_file, 'wb') as f:
            pickle.dump(features, f)
        logger.info(f"Saved {len(features)} features to cache")
    except Exception as e:
        logger.error(f"Failed to save cache: {e}")

def load_local_osm_features(bounds: Tuple[float, float, float, float]) -> List[Dict]:
    key = _cache_key(bounds)
    cached = _load_cached_features(key)
    if cached is not None:
        return cached

    south, west, north, east = bounds
    logger.info(f"Extracting OSM features for bounds {bounds} from {OSM_PBF_PATH}")

    if not os.path.exists(OSM_PBF_PATH):
        logger.error(f"OSM PBF file not found at {OSM_PBF_PATH}")
        return []

    bbox = box(west, south, east, north)
    layers = ['points', 'lines', 'multipolygons', 'multilinestrings']
    all_features = []

    for layer in layers:
        try:
            logger.info(f"Reading layer: {layer}")
            gdf = gpd.read_file(OSM_PBF_PATH, layer=layer, engine='pyogrio', bbox=bbox)
            if gdf.empty:
                continue
            for idx, row in gdf.iterrows():
                geom = row.geometry
                if geom is None or geom.is_empty:
                    continue
                props = {}
                for k, v in row.items():
                    if k not in ['geometry'] and pd.notna(v):
                        if hasattr(v, 'item'):
                            v = v.item()
                        props[k] = v
                feature = {
                    'type': 'Feature',
                    'geometry': geom.__geo_interface__,
                    'properties': props
                }
                all_features.append(feature)
        except Exception as e:
            logger.warning(f"Error reading layer {layer}: {e}")
            continue

    logger.info(f"Extracted total {len(all_features)} features")
    _save_features_to_cache(key, all_features)
    return all_features

def rasterize_features(
    features: List[Dict],
    bounds: Tuple[float, float, float, float],
    grid_size: int,
    influence_radius_m: float = 50
) -> np.ndarray:
    if not features:
        return np.zeros((grid_size, grid_size), dtype=np.float32)

    south, west, north, east = bounds
    xs = np.linspace(west, east, grid_size)
    ys = np.linspace(south, north, grid_size)
    impedance_delta = np.zeros((grid_size, grid_size), dtype=np.float32)

    for feature in features:
        try:
            geom = shape(feature['geometry'])
            props = feature.get('properties', {})
        except (TopologicalError, ValueError, KeyError):
            continue

        modifier = 0.0
        if 'highway' in props:
            modifier += FEATURE_IMPEDANCE.get(props['highway'], 0.0)
        if 'railway' in props:
            modifier += FEATURE_IMPEDANCE.get('rail', 0.0)
        if 'waterway' in props:
            modifier += FEATURE_IMPEDANCE.get(props['waterway'], 0.0)
        if 'natural' in props:
            modifier += FEATURE_IMPEDANCE.get(props['natural'], 0.0)
        if 'landuse' in props:
            modifier += FEATURE_IMPEDANCE.get(props['landuse'], 0.0)
        if 'building' in props and props['building'] is not None:
            modifier += FEATURE_IMPEDANCE.get('building', 0.9)
        if 'military' in props:
            modifier += FEATURE_IMPEDANCE.get(props['military'], 0.0)
        if 'bridge' in props and props['bridge'] == 'yes':
            modifier += FEATURE_IMPEDANCE.get('bridge', -0.3)
        if 'power' in props and props['power'] == 'line':
            modifier += FEATURE_IMPEDANCE.get('power_line', 0.2)

        if abs(modifier) < 1e-6:
            continue

        if geom.geom_type == 'Point':
            x, y = geom.x, geom.y
            ix = int(round((x - west) / (east - west) * grid_size))
            iy = int(round((y - south) / (north - south) * grid_size))
            if 0 <= ix < grid_size and 0 <= iy < grid_size:
                impedance_delta[iy, ix] += modifier

        elif geom.geom_type == 'LineString':
            coords = np.array(geom.coords)
            grid_coords = np.zeros_like(coords)
            grid_coords[:, 0] = (coords[:, 0] - west) / (east - west) * grid_size
            grid_coords[:, 1] = (coords[:, 1] - south) / (north - south) * grid_size
            for k in range(len(grid_coords)-1):
                x1 = round(grid_coords[k, 0])
                y1 = round(grid_coords[k, 1])
                x2 = round(grid_coords[k+1, 0])
                y2 = round(grid_coords[k+1, 1])
                cells = bresenham(int(x1), int(y1), int(x2), int(y2))
                for cx, cy in cells:
                    if 0 <= cx < grid_size and 0 <= cy < grid_size:
                        impedance_delta[cy, cx] += modifier

        elif geom.geom_type == 'Polygon':
            try:
                poly_path = Path(geom.exterior.coords)
                points = np.array([(x, y) for y in ys for x in xs])
                mask = poly_path.contains_points(points).reshape((grid_size, grid_size))
                impedance_delta[mask] += modifier
            except Exception:
                continue

        elif geom.geom_type == 'MultiPolygon':
            for poly in geom.geoms:
                try:
                    poly_path = Path(poly.exterior.coords)
                    points = np.array([(x, y) for y in ys for x in xs])
                    mask = poly_path.contains_points(points).reshape((grid_size, grid_size))
                    impedance_delta[mask] += modifier
                except Exception:
                    continue

    return impedance_delta

def get_building_mask(bounds: Tuple[float, float, float, float], grid_size: int) -> np.ndarray:
    """Return a boolean mask (True where a building exists) for given bounds."""
    features = load_local_osm_features(bounds)
    south, west, north, east = bounds
    xs = np.linspace(west, east, grid_size)
    ys = np.linspace(south, north, grid_size)
    mask = np.zeros((grid_size, grid_size), dtype=bool)

    for feat in features:
        try:
            geom = shape(feat['geometry'])
            props = feat.get('properties', {})
            if 'building' in props and props['building'] is not None:
                if geom.geom_type == 'Polygon':
                    poly_path = Path(geom.exterior.coords)
                    points = np.array([(x, y) for y in ys for x in xs])
                    inside = poly_path.contains_points(points).reshape((grid_size, grid_size))
                    mask = mask | inside
                elif geom.geom_type == 'MultiPolygon':
                    for poly in geom.geoms:
                        poly_path = Path(poly.exterior.coords)
                        points = np.array([(x, y) for y in ys for x in xs])
                        inside = poly_path.contains_points(points).reshape((grid_size, grid_size))
                        mask = mask | inside
        except Exception:
            continue
    return mask

def bresenham(x0, y0, x1, y1):
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    x, y = x0, y0
    while True:
        yield x, y
        if x == x1 and y == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x += sx
        if e2 <= dx:
            err += dx
            y += sy