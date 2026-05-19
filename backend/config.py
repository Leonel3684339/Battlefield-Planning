import os

# OSM PBF file
OSM_PBF_PATH = r"E:\Army Good File\Army\backend\bayern-260309.osm.pbf"

# Base GIS data folder
GIS_DATA_DIR = r"E:\Army Good File\Army\backend\gis_data"

# Primary land cover raster (used as base in terrain.py)
LANDCOVER_PATH = os.path.join(GIS_DATA_DIR, 'LandCover.tif')
LANDCOVER_MAPPING = {
    1: -0.2,
    2: -0.1,
    3: 0.1,
    5: 0.1,
    6: 0.8,
    7: 0.3,
    255: 0.0,
}

# Other raster layers (soil, trails) – these are added as deltas
RASTER_LAYERS = [
    {
        'path': os.path.join(GIS_DATA_DIR, 'Soil.tif'),
        'scale': 1.0,
        'mapping': {
            3: -0.1,
            12: -0.05,
            40: 0.0,
            41: 0.0,
            80: 0.1,
            100: 0.2,
            120: 0.3,
            255: 0.0,
        },
        'description': 'Soil'
    },
    # Trail rasters (raw modifiers, no mapping needed)
    {'path': os.path.join(GIS_DATA_DIR, 'Roads.tif'), 'scale': 1.0, 'description': 'Roads'},
    {'path': os.path.join(GIS_DATA_DIR, 'Tank_Trails.tif'), 'scale': 1.0, 'description': 'TankTrails'},
    {'path': os.path.join(GIS_DATA_DIR, 'Forest_Trails.tif'), 'scale': 1.0, 'description': 'ForestTrails'},
    {'path': os.path.join(GIS_DATA_DIR, 'Rat_Trails.tif'), 'scale': 1.0, 'description': 'RatTrails'}, 
]

# Boundary shapefile
BOUNDARY_SHAPEFILE_PATH = os.path.join(GIS_DATA_DIR, 'JMRC_Boundary.shp')
BOUNDARY_CRS = "EPSG:32632"

# DEM GeoTIFF
DEM_GEOTIFF_PATH = os.path.join(GIS_DATA_DIR, 'hohenfels_dem.tif')