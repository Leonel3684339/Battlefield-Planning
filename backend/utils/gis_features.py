import rasterio
from rasterio.windows import from_bounds
import numpy as np
from scipy.ndimage import zoom
from pyproj import Transformer 
import traceback
import geopandas as gpd
from shapely.geometry import box
from matplotlib.path import Path
import os

from config import RASTER_LAYERS, BOUNDARY_SHAPEFILE_PATH, BOUNDARY_CRS


def load_raster_delta(raster_info, bounds, grid_size):
    """
    Load a single raster and return a delta grid (grid_size x grid_size).
    raster_info: dict with keys 'path', 'scale', 'mapping' (optional), 'description'
    """
    path = raster_info['path']
    scale = raster_info.get('scale', 1.0)
    mapping = raster_info.get('mapping', None)
    description = raster_info.get('description', 'unknown')

    print(f"  Loading raster {description} from {path}")

    try:
        with rasterio.open(path) as src:
            # Transform bounds to raster CRS
            transformer = Transformer.from_crs("EPSG:4326", src.crs, always_xy=True)
            xmin, ymin = transformer.transform(bounds[1], bounds[0])
            xmax, ymax = transformer.transform(bounds[3], bounds[2])

            window = from_bounds(xmin, ymin, xmax, ymax, src.transform)

            row_start = max(0, int(round(window.row_off)))
            row_stop = min(src.shape[0], row_start + int(round(window.height)))
            col_start = max(0, int(round(window.col_off)))
            col_stop = min(src.shape[1], col_start + int(round(window.width)))

            if row_stop <= row_start or col_stop <= col_start:
                print(f"    Window empty for {description}")
                return np.zeros((grid_size, grid_size), dtype=np.float32)

            data = src.read(1, window=((row_start, row_stop), (col_start, col_stop)))

            # Apply mapping if exists
            if mapping is not None:
                mapped = np.zeros_like(data, dtype=np.float32)
                for code, delta in mapping.items():
                    mapped[data == code] = delta
                data = mapped
            else:
                data = data.astype(np.float32)

            # Resample to grid_size
            if data.shape != (grid_size, grid_size):
                zoom_factors = (
                    grid_size / data.shape[0],
                    grid_size / data.shape[1],
                )
                data = zoom(data, zoom_factors, order=1)

            return data * scale

    except Exception as e:
        print(f"  ❌ Error loading raster {description}: {e}")
        traceback.print_exc()
        return np.zeros((grid_size, grid_size), dtype=np.float32)


def rasterize_boundary(bounds, grid_size):
    """
    Load boundary shapefile and return a boolean mask (True inside boundary).
    Supports Polygon and MultiPolygon geometries.
    """
    if not BOUNDARY_SHAPEFILE_PATH:
        return None

    try:
        gdf = gpd.read_file(BOUNDARY_SHAPEFILE_PATH)

        # CRS handling
        src_crs = gdf.crs
        if src_crs is None:
            print(f"Boundary shapefile has no CRS. Using config CRS: {BOUNDARY_CRS}")
            src_crs = BOUNDARY_CRS

        # Transform bounds to shapefile CRS
        transformer = Transformer.from_crs("EPSG:4326", src_crs, always_xy=True)
        south, west, north, east = bounds

        xmin, ymin = transformer.transform(west, south)
        xmax, ymax = transformer.transform(east, north)

        bbox = box(xmin, ymin, xmax, ymax)

        filtered = gdf[gdf.geometry.intersects(bbox)]

        if filtered.empty:
            print("Boundary shapefile has no features intersecting the bounds")
            return None

        # 🔥 FIX: Handle MultiPolygon safely
        boundary_geom = filtered.geometry.unary_union

        if boundary_geom.geom_type == "Polygon":
            polygons = [boundary_geom]

        elif boundary_geom.geom_type == "MultiPolygon":
            polygons = list(boundary_geom.geoms)

        else:
            print(f"⚠️ Unsupported geometry type: {boundary_geom.geom_type}")
            return None

        # Create grid points in lat/lon
        xs = np.linspace(west, east, grid_size)
        ys = np.linspace(south, north, grid_size)
        points = np.array([(x, y) for y in ys for x in xs])

        # Transformer back to lat/lon
        inv_transformer = Transformer.from_crs(src_crs, "EPSG:4326", always_xy=True)

        mask = np.zeros(len(points), dtype=bool)

        for poly in polygons:
            if poly.is_empty:
                continue

            exterior_coords = np.array(poly.exterior.coords)

            latlon_coords = []
            for x, y in exterior_coords:
                lon, lat = inv_transformer.transform(x, y)
                latlon_coords.append((lon, lat))

            if len(latlon_coords) < 3:
                continue

            path = Path(np.array(latlon_coords))
            mask |= path.contains_points(points)

        inside = mask.reshape(grid_size, grid_size)

        print(f"✅ Boundary mask created: {np.sum(inside)} cells inside")
        return inside

    except Exception as e:
        print(f"⚠️ Error loading boundary shapefile: {e}")
        traceback.print_exc()
        return None


def load_gis_delta(bounds, grid_size):
    """
    Load all raster layers and return:
    - total delta grid
    - boundary mask
    """
    print("🔄 load_gis_delta called")

    total_delta = np.zeros((grid_size, grid_size), dtype=np.float32)

    for layer in RASTER_LAYERS:
        delta = load_raster_delta(layer, bounds, grid_size)
        total_delta += delta

    boundary_mask = rasterize_boundary(bounds, grid_size)

    return total_delta, boundary_mask