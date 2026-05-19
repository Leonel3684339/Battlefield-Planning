import rasterio
from rasterio.windows import from_bounds
import numpy as np
from scipy.ndimage import zoom
from config import DEM_GEOTIFF_PATH
import pyproj
from pyproj import Transformer

_dem_data = None
_dem_transform = None
_dem_bounds = None
_dem_crs = None
_transformer = None
_inv_transformer = None

def load_dem():
    """Load DEM from GeoTIFF once and cache it."""
    global _dem_data, _dem_transform, _dem_bounds, _dem_crs, _transformer, _inv_transformer
    if _dem_data is None:
        with rasterio.open(DEM_GEOTIFF_PATH) as src:
            _dem_data = src.read(1)
            _dem_transform = src.transform
            _dem_crs = src.crs
            _dem_bounds = src.bounds  # (left, bottom, right, top) in file's CRS
            # Set up coordinate transformers
            if _dem_crs is not None:
                _transformer = Transformer.from_crs("EPSG:4326", _dem_crs, always_xy=True)
                _inv_transformer = Transformer.from_crs(_dem_crs, "EPSG:4326", always_xy=True)
    return _dem_data, _dem_transform, _dem_crs, _dem_bounds

def get_elevation_grid_local(bounds, grid_size):
    """
    Extract elevation grid from local DEM.
    bounds: (south, west, north, east) in WGS84.
    Returns 2D numpy array (grid_size x grid_size) or None.
    """
    south, west, north, east = bounds

    # Load DEM
    dem, transform, crs, dem_bounds = load_dem()
    if crs is None:
        print("DEM has no CRS, cannot transform")
        return None

    # Transform bounds to DEM's CRS
    try:
        xmin, ymin = _transformer.transform(west, south)
        xmax, ymax = _transformer.transform(east, north)
    except Exception as e:
        print(f"Failed to transform bounds: {e}")
        return None

    # Check if transformed bounds intersect DEM extent
    dem_minx, dem_miny, dem_maxx, dem_maxy = dem_bounds
    if xmin > dem_maxx or xmax < dem_minx or ymin > dem_maxy or ymax < dem_miny:
        print(f"Transformed bounds {xmin},{ymin},{xmax},{ymax} outside DEM extent {dem_bounds}")
        return None

    # Get window using transformed coordinates
    window = from_bounds(xmin, ymin, xmax, ymax, transform=transform)
    # Round to integer pixel coordinates (rasterio's window gives floats)
    row_start = max(0, int(round(window.row_off)))
    row_stop = min(dem.shape[0], row_start + int(round(window.height)))
    col_start = max(0, int(round(window.col_off)))
    col_stop = min(dem.shape[1], col_start + int(round(window.width)))
    
    
    if row_stop <= row_start or col_stop <= col_start:

        return None
    data = dem[row_start:row_stop, col_start:col_stop]

    # Resample to target grid_size if needed
    if data.shape[0] != grid_size or data.shape[1] != grid_size:
        zoom_factors = (grid_size / data.shape[0], grid_size / data.shape[1])
        data = zoom(data, zoom_factors, order=1)  # bilinear interpolation

       
    return data
