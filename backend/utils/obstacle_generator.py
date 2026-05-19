import random
import math
from typing import List, Dict, Optional, Tuple


# List of obstacle types for export
obstacle_types = [
    ('OBWL', 'Low Wire Fence', 50),
    ('OBWH', 'High Wire Fence', 50),
    ('OBW', 'Wire Obstacle (General)', 50),
    ('OBWC', 'Concertina Wire', 30),
    ('OBWD', 'Double Apron Wire', 60),
    ('OBWT', 'Triple Concertina', 40),
    ('OMP', 'AP Mine (General)', 100),
    ('OMPA', 'AP Bounding Mine', 80),
    ('OMPD', 'AP Directional (Claymore)', 60),
    ('OMPF', 'AP Fragmentation', 80),
    ('OMPB', 'AP Blast Mine', 70),
    ('OMT', 'AT Mine (General)', 100),
    ('OMTA', 'AT Blast Mine', 100),
    ('OMTD', 'AT Directional Mine', 80),
    ('OMTS', 'AT Scatterable', 120),
    ('OMD', 'AT with Antihandling', 100),
    ('OME', 'AT Directional (other)', 80),
    ('OMW', 'Wide Area Mine', 200),
    ('OMU', 'Unspecified Mine', 100),
    ('OBB', 'Barrier (General)', 50),
    ('OBBT', 'Tank Ditch', 150),
    ('OBBR', 'Roadblock', 50),
    ('OBBC', 'Crater', 80),
    ('OBBW', 'Log Wall', 40),
    ('OBBV', 'Vehicle Barrier', 60),
    ('OBBH', 'Hedgehog', 30),
    ('OBBD', "Dragon's Teeth", 60),
    ('OBBB', 'Belgian Gate', 40),
    ('OBE', 'Existing Obstacle', 0),
    ('OBES', 'Steep Slope', 0),
    ('OBER', 'River/Lake', 0),
    ('OBEF', 'Forest', 0),
    ('OBEW', 'Wetland', 0),
    ('OBT', 'Turn Obstacle', 0),
    ('OBD', 'Disrupt Obstacle', 0),
    ('OBBLK', 'Block Obstacle', 0),
    ('OBF', 'Fix Obstacle', 0),
    ('OBCNL', 'Canalize Obstacle', 0),
]

def generate_obstacles(
    intensity: float,
    correlation: float,
    model: str,
    bounds: Optional[Tuple[float, float, float, float]] = None
) -> List[Dict]:
    """
    Generate obstacles with same logic as frontend mock.
    Returns list of obstacle dicts with keys: id, lat, lng, radius, typeCode, typeName.
    """
    num_obstacles = int(intensity * 30) + 5
    obstacles = []
    
    # Default bounds (London area)
    south, west, north, east = 51.5, -0.1, 51.51, -0.08
    if bounds:
        south, west, north, east = bounds
    
    min_dist = 0.001 * (1 - correlation)  # approx 100m at equator
    
    for i in range(num_obstacles):
        attempts = 0
        placed = False
        while not placed and attempts < 100:
            lat = south + random.random() * (north - south)
            lng = west + random.random() * (east - west)
            
            # Choose a random obstacle type from the global list
            code, name, default_radius = random.choice(obstacle_types)
            radius = default_radius or random.randint(50, 250)
            
            if model == 'strauss':
                too_close = False
                for obs in obstacles:
                    dx = obs['lng'] - lng
                    dy = obs['lat'] - lat
                    if math.sqrt(dx*dx + dy*dy) < min_dist:
                        too_close = True
                        break
                if not too_close:
                    obstacles.append({
                        'id': f"ai-{i}-{random.randint(1000,9999)}",
                        'lat': lat,
                        'lng': lng,
                        'radius': radius,
                        'typeCode': code,
                        'typeName': name,
                    })
                    placed = True
            else:  # poisson
                obstacles.append({
                    'id': f"ai-{i}-{random.randint(1000,9999)}",
                    'lat': lat,
                    'lng': lng,
                    'radius': radius,
                    'typeCode': code,
                    'typeName': name,
                })
                placed = True
            attempts += 1
    return obstacles