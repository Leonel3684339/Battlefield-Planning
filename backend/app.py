from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from utils.doctrinal_generator import generate_doctrinal_obstacles
from utils.terrain import get_complete_terrain_analysis, generate_mobility_image
from utils.export_pdf import generate_pdf_report
from utils.export_milx import generate_milx
import io
import time
import csv
from io import StringIO
import numpy as np


app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# -------------------------------------------------------------------
# Terrain grid cache (short TTL to avoid repeated identical requests)
# -------------------------------------------------------------------
terrain_grid_cache = {}
CACHE_TTL = 10  # seconds

def get_cached_terrain_grid(bounds, grid_size):
    key = (tuple(bounds), grid_size)
    now = time.time()
    if key in terrain_grid_cache:
        data, timestamp = terrain_grid_cache[key]
        if now - timestamp < CACHE_TTL:
            return data
        else:
            del terrain_grid_cache[key]
    return None

def set_cached_terrain_grid(bounds, grid_size, data):
    key = (tuple(bounds), grid_size)
    terrain_grid_cache[key] = (data, time.time())
# -------------------------------------------------------------------

@app.route('/api/generate', methods=['POST', 'OPTIONS'])
def generate():
    if request.method == 'OPTIONS':
        return '', 200
    data = request.json
    intensity = data.get('intensity', 0.5)
    correlation = data.get('correlation', 0.3)
    model = data.get('model', 'strauss')
    bounds = data.get('bounds')
    target = data.get('target', 'mechanized infantry')
    effect = data.get('effect', 'disrupt')
    relative_location = data.get('relativeLocation', 'avenue of approach')
    mett_tc = data.get('mett_tc', {})
    path = data.get('path')  # list of [lng, lat]
    polygon = data.get('polygon')  # list of [lng, lat]
    print(f"🔍 Received polygon: {polygon is not None}")
    if polygon:
        print(f"   Polygon type: {polygon.get('type')}")
        coords = polygon.get('coordinates', [])
        if coords:
            print(f"   First coordinate: {coords[0][0] if coords[0] else 'None'}")
            print(f"   Number of rings: {len(coords)}")

    # Enemy data
    enemy_data = data.get('enemy')
    enemy_position = None
    enemy_direction = None
    enemy_speed = None
    if enemy_data:
        enemy_position = tuple(enemy_data['position'])  # (lat, lng)
        enemy_direction = enemy_data['direction']
        enemy_speed = enemy_data['speed']

    # Objective
    objective = data.get('objective')
    if not objective and bounds:
        # Default to center of bounds
        south, west, north, east = bounds
        objective = ((south + north) / 2, (west + east) / 2)

    start_time = time.time()
    obstacles, path_coords = generate_doctrinal_obstacles(
        bounds, target, effect, relative_location, mett_tc,
        intensity, correlation, model, path=path,
        enemy_position=enemy_position,
        enemy_direction=enemy_direction,
        enemy_speed=enemy_speed,
        objective=objective,
        polygon=polygon
    )
    elapsed = time.time() - start_time
    print(f"⏱️ Obstacle generation took {elapsed:.2f} seconds")

    return jsonify({'obstacles': obstacles, 'path': path_coords})

@app.route('/api/terrain', methods=['POST', 'OPTIONS'])
def get_terrain_image():
    if request.method == 'OPTIONS':
        return '', 200
    data = request.json
    bounds = data.get('bounds')
    if not bounds:
        return jsonify({'error': 'bounds required'}), 400

    try:
        start_time = time.time()
        terrain = get_complete_terrain_analysis(tuple(bounds))
        if terrain is None:
            return jsonify({'error': 'terrain data unavailable'}), 500

        img_bytes = generate_mobility_image(terrain)
        elapsed = time.time() - start_time
        print(f"⏱️ Terrain image generation took {elapsed:.2f} seconds")

        return send_file(io.BytesIO(img_bytes), mimetype='image/png')
    except Exception as e:
        print(f"Terrain image error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/terrain/grid', methods=['POST'])
def get_terrain_grid():
    data = request.json
    bounds = tuple(data['bounds'])
    grid_size = data.get('grid_size', 100)

    # Check cache
    cached = get_cached_terrain_grid(bounds, grid_size)
    if cached is not None:
        return jsonify(cached)

    terrain = get_complete_terrain_analysis(bounds, grid_size=grid_size)
    if terrain is None:
        return jsonify({'error': 'terrain unavailable'}), 500
    impedance = terrain['impedance'].tolist()
    result = {
        'impedance': impedance,
        'bounds': bounds,
        'grid_size': grid_size
    }
    set_cached_terrain_grid(bounds, grid_size, result)
    return jsonify(result)

@app.route('/api/export/pdf', methods=['POST'])
def export_pdf():
    """Generate and return a PDF report of the current plan."""
    data = request.json
    obstacles = data.get('obstacles', [])
    units = data.get('units', [])
    doctrinal_params = data.get('doctrinalParams', {})
    terrain_stats = data.get('terrainStats', {})
    map_image = data.get('mapImage')  # base64 encoded image

    pdf_bytes = generate_pdf_report(obstacles, units, doctrinal_params, terrain_stats, map_image)

    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype='application/pdf',
        as_attachment=True,
        download_name='tactical_plan.pdf'
    )

@app.route('/api/export/milx', methods=['POST'])
def export_milx():
    """Generate and return a MILX XML file."""
    data = request.json
    obstacles = data.get('obstacles', [])
    units = data.get('units', [])
    doctrinal_params = data.get('doctrinalParams', {})

    milx_str = generate_milx(obstacles, units, doctrinal_params)

    return send_file(
        io.BytesIO(milx_str.encode('utf-8')),
        mimetype='application/xml',
        as_attachment=True,
        download_name='tactical_plan.milx'
    )

@app.route('/api/export/csv', methods=['POST'])
def export_csv():
    """Generate and return a CSV file of obstacles and units."""
    data = request.json
    obstacles = data.get('obstacles', [])
    units = data.get('units', [])

    output = StringIO()
    writer = csv.writer(output)

    # Obstacles section
    writer.writerow(['OBSTACLES'])
    writer.writerow(['ID', 'Type', 'Latitude', 'Longitude', 'Radius (m)'])
    for obs in obstacles:
        writer.writerow([obs['id'], obs['typeName'], obs['lat'], obs['lng'], obs['radius']])

    writer.writerow([])  # blank line

    # Units section
    writer.writerow(['UNITS'])
    writer.writerow(['ID', 'Type', 'Affiliation', 'Echelon', 'Latitude', 'Longitude', 'HQ', 'TaskForce'])
    for unit in units:
        hq = unit.get('modifiers', {}).get('headquarters', False)
        tf = unit.get('modifiers', {}).get('taskForce', False)
        writer.writerow([
            unit['id'],
            unit.get('name', unit['typeCode']),
            unit['affiliation'],
            unit.get('echelon', 'none'),
            unit['lat'],
            unit['lng'],
            'Yes' if hq else 'No',
            'Yes' if tf else 'No'
        ])

    csv_bytes = output.getvalue().encode('utf-8')
    return send_file(
        io.BytesIO(csv_bytes),
        mimetype='text/csv',
        as_attachment=True,
        download_name='tactical_plan.csv'
    )


if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')