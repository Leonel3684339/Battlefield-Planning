import rasterio
import numpy as np

def inspect_raster(path):
    with rasterio.open(path) as src:
        print(f"File: {path}")
        print("CRS:", src.crs)                     # coordinate system
        print("Bounds:", src.bounds)               # (left, bottom, right, top)
        print("Shape:", src.shape)                 # (rows, columns)
        print("Data type:", src.dtypes[0])         # e.g., uint8, int16, float32
        # Read first band
        data = src.read(1)
        print("Unique values:", np.unique(data))   # distinct values (for categorical)
        # Optionally, print min/max for continuous data
        print("Min:", np.min(data), "Max:", np.max(data))
        print("-" * 100)

    
# Run for both files

inspect_raster(r'E:\Army Good File\Army\backend\gis_data\Soil.tif')
inspect_raster(r'E:\Army Good File\Army\backend\gis_data\LandCover.tif')



