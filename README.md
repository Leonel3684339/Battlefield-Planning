# SCOS – Stochastic Correlated Obstacle Scene

**SCOS** is a tactical decision aid for military obstacle planning. It helps commanders and planners place obstacles (minefields, tank ditches, wire barriers) based on terrain data, enemy movement prediction, and US Army doctrine. The system provides a web‑based map interface, an AI‑assisted obstacle generator, and a simulation module.

## Features

- **Interactive map** (Leaflet) – draw areas, place obstacles/units, set enemy position and objective.
- **Doctrinal obstacle generation** – uses METT‑TC, target, effect, and relative location to select appropriate obstacle types.
- **Terrain analysis** – combines elevation (DEM), land cover, soil, road/trail networks, and OSM features to create a mobility impedance grid.
- **Enemy path prediction** – A* pathfinding with obstacle delays; visualises enemy corridor and planned route.
- **Reinforcement Learning** – experimental RL agent (PPO) that learns to place obstacles by maximising enemy delay.
- **Export** – KML, KMZ (Google Earth), PDF, CSV, MILX.
- **Save/Load scenarios** – JSON format.
- **Military symbols** – MIL‑STD‑2525 compliant symbols via `milsymbol` library.

## Tech Stack

- **Frontend**: React, TypeScript, Leaflet, Tailwind CSS, milsymbol
- **Backend**: Python, Flask, NumPy, SciPy, Rasterio, GeoPandas, Shapely, Stable‑Baselines3 (RL)

## Project Structure
scos-dashboard/ # React frontend
backend/ # Flask backend
├── utils/ # Terrain, doctrinal generator, RL env, etc.
├── gis_data/ # GeoTIFFs, shapefiles, OSM PBF
├── terrain_cache/ # Cached impedance grids
├── app.py # Main Flask application
├── config.py # Paths and raster mappings
├── train_rl.py # Train RL agent
└── requirements.txt


## Installation

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # or .\venv\Scripts\activate on Windows
pip install -r requirements.txt
"# Battle-Field-Plan" 
