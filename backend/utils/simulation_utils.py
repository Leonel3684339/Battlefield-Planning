import numpy as np
import math
from .pathfinding import aStar  # we already have aStar in pathfinding.py

def simulate_movement(bounds, terrain, obstacles, enemy_start, objective, speed=30):
    """
    Simulate enemy movement from start to objective, using terrain grid and obstacle penalties.
    Returns total delay in seconds.
    """
    impedance = terrain['impedance']  # 100x100 grid
    # Compute path using pure impedance (no obstacle penalties)
    # Convert start and objective to grid indices
    south, west, north, east = bounds
    size = impedance.shape[0]
    lat_to_idx = lambda lat: int((lat - south) / (north - south) * size)
    lng_to_idx = lambda lng: int((lng - west) / (east - west) * size)
    start_idx = (lat_to_idx(enemy_start[0]), lng_to_idx(enemy_start[1]))
    goal_idx = (lat_to_idx(objective[0]), lng_to_idx(objective[1]))
    path = aStar(impedance, start_idx, goal_idx, False)  # returns (path, cost) where path is list of (row,col)
    if path is None:
        return 0

    # Convert path to lat/lng and compute distance and time
    cell_size_lat = (north - south) * 111000 / size
    cell_size_lng = (east - west) * 111000 * math.cos((south+north)*math.pi/360) / size
    cell_size = (cell_size_lat + cell_size_lng) / 2
    distance = len(path) * cell_size  # approximate
    time_sec = distance / (speed * 1000 / 3600)

    # Add obstacle delays
    total_delay = 0
    for obs in obstacles:
        # simple: if obstacle is within certain distance of path, add delay
        # we can just check if any path point is within obstacle radius
        obs_pos = (obs['lat'], obs['lng'])
        for pt in path:
            # compute distance in meters
            lat1, lng1 = obs_pos
            lat2, lng2 = pt
            dx = (lng2 - lng1) * 111000 * math.cos((lat1+lat2)*math.pi/360)
            dy = (lat2 - lat1) * 111000
            if math.hypot(dx, dy) < obs['radius']:
                if obs['typeCode'].startswith('OM'):
                    total_delay += 30
                elif obs['typeCode'] == 'OBBT':
                    total_delay += 45
                elif obs['typeCode'].startswith('OBW'):
                    total_delay += 15
                else:
                    total_delay += 20
                break  # each obstacle counted once
    return time_sec + total_delay