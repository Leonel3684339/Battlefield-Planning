import requests
import numpy as np
from typing import Tuple, Optional, Dict
from io import BytesIO
from PIL import Image
import math
import time
import os
import base64
from dotenv import load_dotenv

# Load environment variables from .env file (if present)
load_dotenv()

# Copernicus 10m Land Cover Class Mapping to NATO-relevant categories
# Based on actual Copernicus LCM 10m classes
LAND_COVER_CLASSES = {
    # Forest classes
    111: {'name': 'Closed forest, evergreen needleleaf', 'category': 'forest', 'impedance': 0.7, 'cover': 0.8},
    112: {'name': 'Closed forest, evergreen broadleaf', 'category': 'forest', 'impedance': 0.7, 'cover': 0.8},
    113: {'name': 'Closed forest, deciduous needleleaf', 'category': 'forest', 'impedance': 0.7, 'cover': 0.7},
    114: {'name': 'Closed forest, deciduous broadleaf', 'category': 'forest', 'impedance': 0.7, 'cover': 0.7},
    115: {'name': 'Closed forest, mixed', 'category': 'forest', 'impedance': 0.7, 'cover': 0.7},
    116: {'name': 'Closed forest, unknown', 'category': 'forest', 'impedance': 0.7, 'cover': 0.7},
    121: {'name': 'Open forest, evergreen needleleaf', 'category': 'forest', 'impedance': 0.6, 'cover': 0.5},
    122: {'name': 'Open forest, evergreen broadleaf', 'category': 'forest', 'impedance': 0.6, 'cover': 0.5},
    123: {'name': 'Open forest, deciduous needleleaf', 'category': 'forest', 'impedance': 0.6, 'cover': 0.5},
    124: {'name': 'Open forest, deciduous broadleaf', 'category': 'forest', 'impedance': 0.6, 'cover': 0.5},
    125: {'name': 'Open forest, mixed', 'category': 'forest', 'impedance': 0.6, 'cover': 0.5},
    126: {'name': 'Open forest, unknown', 'category': 'forest', 'impedance': 0.6, 'cover': 0.5},
    
    # Shrubland
    20: {'name': 'Shrubs', 'category': 'shrubland', 'impedance': 0.5, 'cover': 0.5},
    
    # Grassland
    30: {'name': 'Herbaceous vegetation', 'category': 'grassland', 'impedance': 0.3, 'cover': 0.3},
    
    # Cropland
    40: {'name': 'Cropland', 'category': 'cropland', 'impedance': 0.3, 'cover': 0.2},
    
    # Urban / Built-up
    50: {'name': 'Urban / Built-up', 'category': 'urban', 'impedance': 0.8, 'cover': 0.9},
    
    # Bare / Sparse vegetation
    60: {'name': 'Bare / Sparse vegetation', 'category': 'bare', 'impedance': 0.4, 'cover': 0.1},
    61: {'name': 'Consolidated bare areas', 'category': 'bare', 'impedance': 0.4, 'cover': 0.1},
    62: {'name': 'Unconsolidated bare areas', 'category': 'bare', 'impedance': 0.5, 'cover': 0.1},
    
    # Snow and Ice
    70: {'name': 'Snow and Ice', 'category': 'snow', 'impedance': 0.9, 'cover': 1.0},
    
    # Water
    80: {'name': 'Water bodies', 'category': 'water', 'impedance': 1.0, 'cover': 1.0},
    81: {'name': 'Open water bodies', 'category': 'water', 'impedance': 1.0, 'cover': 1.0},
    82: {'name': 'Inland water bodies', 'category': 'water', 'impedance': 1.0, 'cover': 1.0},
    83: {'name': 'Sea water bodies', 'category': 'water', 'impedance': 1.0, 'cover': 1.0},
    
    # Wetland
    90: {'name': 'Herbaceous wetland', 'category': 'wetland', 'impedance': 0.8, 'cover': 0.7},
    91: {'name': 'Wetland', 'category': 'wetland', 'impedance': 0.8, 'cover': 0.7},
    92: {'name': 'Moss and Lichen', 'category': 'wetland', 'impedance': 0.6, 'cover': 0.5},
}

# Cache for landcover data (in-memory)
LANDCOVER_CACHE: Dict[str, Tuple[float, np.ndarray]] = {}
CACHE_DURATION = 3600  # seconds (1 hour)

def _cache_key(bounds: Tuple[float, float, float, float]) -> str:
    """Create a cache key from bounds rounded to 4 decimals."""
    return f"{bounds[0]:.4f},{bounds[1]:.4f},{bounds[2]:.4f},{bounds[3]:.4f}"

def fetch_copernicus_landcover_wms(
    bounds: Tuple[float, float, float, float],
    width: int = 256,
    height: int = 256,
    year: int = 2023,
    username: str = None,
    password: str = None
) -> Optional[np.ndarray]:
    """
    Fetch Copernicus 10m land cover data via WMS with authentication.
    Evalscript is base64‑encoded to avoid URI template issues.
    """
    south, west, north, east = bounds
    
    wms_url = "https://land.copernicus.eu/geoserver/CLC/wms"
    
    evalscript = """
    //VERSION=3
    function setup() {
        return {
            input: ["LC"],
            output: { bands: 1, sampleType: "UINT16" }
        };
    }
    
    function evaluatePixel(sample) {
        return [sample.LC];
    }
    """
    
    # Base64 encode the evalscript (remove leading/trailing whitespace)
    evalscript_b64 = base64.b64encode(evalscript.strip().encode()).decode()
    
    params = {
        'service': 'WMS',
        'request': 'GetMap',
        'version': '1.3.0',
        'layers': 'CLMS_GLO_DLCM_10m',
        'styles': '',
        'format': 'image/png',
        'crs': 'EPSG:4326',
        'bbox': f"{south},{west},{north},{east}",
        'width': width,
        'height': height,
        'evalscript': evalscript_b64,  # base64‑encoded
        'time': f"{year}-01-01"
    }
    
    auth = None
    if username and password:
        auth = (username, password)
    
    try:
        response = requests.get(wms_url, params=params, timeout=30, auth=auth)
        response.raise_for_status()
        
        img = Image.open(BytesIO(response.content))
        
        if img.mode == 'P':
            img = img.convert('RGB')
            class_data = np.array(img)[:,:,0]
        elif img.mode == 'L':
            class_data = np.array(img)
        else:
            img = img.convert('L')
            class_data = np.array(img)
            
        return class_data.astype(np.uint16)
        
    except requests.exceptions.HTTPError as e:
        print(f"WMS landcover fetch HTTP error: {e}")
        if e.response is not None:
            print(f"Response status: {e.response.status_code}")
            print(f"Response content: {e.response.text}")
        return None
    except Exception as e:
        print(f"WMS landcover fetch failed: {e}")
        return None

def generate_synthetic_landcover(
    bounds: Tuple[float, float, float, float],
    grid_size: int
) -> np.ndarray:
    """
    Generate synthetic land cover with class probabilities that vary by latitude.
    Higher latitudes get more forest; lower latitudes get more shrubland; coastal areas may have water.
    """
    south, west, north, east = bounds
    lc_grid = np.zeros((grid_size, grid_size), dtype=np.uint16)
    
    # Base class weights (will be adjusted by latitude)
    base_weights = {
        30: 0.3,   # Grassland
        40: 0.2,   # Cropland
        50: 0.1,   # Urban
        114: 0.25, # Deciduous forest
        20: 0.1,   # Shrubland
        80: 0.05,  # Water
    }
    
    classes = list(base_weights.keys())
    
    for i in range(grid_size):
        for j in range(grid_size):
            lat = south + (i + 0.5) * (north - south) / grid_size
            lng = west + (j + 0.5) * (east - west) / grid_size
            
            # Adjust weights based on latitude
            weights = base_weights.copy()
            
            # Higher latitudes (north) → more forest, less shrubland
            if lat > 50:
                weights[114] *= 1.5   # increase forest
                weights[20] *= 0.5    # decrease shrubland
            elif lat < 30:
                weights[114] *= 0.5   # decrease forest
                weights[20] *= 1.5    # increase shrubland
            
            # Near coast? Very crude: if close to large water bodies? Hard to know.
            # Instead, we'll add a random chance for water based on position
            # Use a sine pattern to create some spatial correlation
            water_factor = (math.sin(lat * 10) * math.cos(lng * 10) + 1) / 2
            if water_factor > 0.95:
                weights[80] *= 3   # increase water probability
            
            # Normalize weights
            total = sum(weights.values())
            norm_weights = [weights[c] / total for c in classes]
            
            # Choose class based on random number seeded by lat/lng
            # Use a deterministic pseudo‑random value to keep consistency
            rand_val = (math.sin(lat * 50) * math.cos(lng * 50) + 1) / 2
            
            cum = 0
            for idx, cls in enumerate(classes):
                cum += norm_weights[idx]
                if rand_val < cum:
                    lc_grid[i, j] = cls
                    break
            else:
                lc_grid[i, j] = classes[-1]
    
    return lc_grid

def get_landcover_for_bounds(
    bounds: Tuple[float, float, float, float],
    grid_size: int = 256
) -> Optional[np.ndarray]:
    """
    High-level function to get land cover data for given bounds.
    Attempts cache first, then WMS (with credentials), then synthetic.
    """
    key = _cache_key(bounds)

    # Check cache
    if key in LANDCOVER_CACHE:
        ts, data = LANDCOVER_CACHE[key]
        if time.time() - ts < CACHE_DURATION:
            print("Using cached landcover data")
            return data
        else:
            del LANDCOVER_CACHE[key]

    # Get credentials from environment
    username = os.getenv('COPERNICUS_USERNAME')
    password = os.getenv('COPERNICUS_PASSWORD')
    
    if username and password:
        print(f"Attempting WMS fetch for bounds: {bounds}")
        lc_grid = fetch_copernicus_landcover_wms(
            bounds, 
            width=grid_size, 
            height=grid_size,
            username=username,
            password=password
        )
        if lc_grid is not None:
            print("WMS successful, caching result")
            LANDCOVER_CACHE[key] = (time.time(), lc_grid)
            return lc_grid
        else:
            print("WMS failed with credentials, falling back to synthetic")
    else:
        print("Copernicus credentials not set, using synthetic land cover")

    # Fallback to synthetic
    print("Generating synthetic land cover")
    lc_grid = generate_synthetic_landcover(bounds, grid_size)
    LANDCOVER_CACHE[key] = (time.time(), lc_grid)
    return lc_grid

def compute_mobility_impedance(
    landcover_grid: np.ndarray,
    slope_grid: np.ndarray
) -> np.ndarray:
    """
    Combine land cover and slope to compute overall mobility impedance.
    Higher values = more difficult terrain (0-1 scale).
    """
    impedance = np.zeros_like(slope_grid, dtype=float)
    
    for i in range(landcover_grid.shape[0]):
        for j in range(landcover_grid.shape[1]):
            lc_code = landcover_grid[i, j]
            slope = slope_grid[i, j]
            
            lc_info = LAND_COVER_CLASSES.get(lc_code, {'impedance': 0.5})
            base_impedance = lc_info['impedance']
            
            if slope < 5:
                slope_factor = 1.0
            elif slope < 15:
                slope_factor = 1.5
            else:
                slope_factor = 2.5
            
            impedance[i, j] = min(1.0, base_impedance * slope_factor)
    
    return impedance

def classify_terrain_by_passability(
    impedance: np.ndarray
) -> Tuple[np.ndarray, Dict]:
    """
    Classify terrain into NATO mobility categories:
    - GO (0–0.25): Good mobility
    - SLOW GO (0.25–0.7): Restricted mobility
    - NO GO (0.7–1.0): Impassable
    """
    go_grid = np.zeros(impedance.shape, dtype='<U8')
    go_grid[impedance <= 0.25] = 'GO'
    go_grid[(impedance > 0.25) & (impedance <= 0.7)] = 'SLOW GO'
    go_grid[impedance > 0.7] = 'NO GO'
    
    total = impedance.size
    stats = {
        'GO': np.sum(go_grid == 'GO') / total * 100,
        'SLOW GO': np.sum(go_grid == 'SLOW GO') / total * 100,
        'NO GO': np.sum(go_grid == 'NO GO') / total * 100
    }
    
    return go_grid, stats