#!/usr/bin/env python
"""
Pre‑warm the terrain cache by processing common geographic areas.
Run this once after setting up the system.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from utils.terrain import get_complete_terrain_analysis

# Define areas of interest (Germany)
# Format: (south, west, north, east)
AREAS = [
    # Berlin region
    (52.3382448, 13.088345, 52.6755087, 13.7611609),
    # Munich region
    (48.061622, 11.360295, 48.248121, 11.722871),
    # Hamburg region
    (53.395965, 9.861824, 53.695432, 10.128908),
    # Frankfurt region
    (50.037933, 8.456345, 50.228101, 8.812235),
    # Cologne region
    (50.859482, 6.857415, 51.058291, 7.124567),
    # Stuttgart region
    (48.684024, 9.048287, 48.868987, 9.312456),
    # All of Germany (rough bounding box)
    (47.2701114, 5.866315, 55.058234, 15.041896),
]

print("🌍 Pre‑warming terrain cache...")
print("=" * 60)

for i, bounds in enumerate(AREAS, 1):
    print(f"[{i}/{len(AREAS)}] Processing {bounds}...")
    try:
        terrain = get_complete_terrain_analysis(bounds)
        if terrain:
            stats = terrain.get('mobility_stats', {})
            print(f"  ✅ Cached – GO: {stats.get('GO',0):.1f}%, SLOW GO: {stats.get('SLOW GO',0):.1f}%, NO GO: {stats.get('NO GO',0):.1f}%")
        else:
            print(f"  ❌ Failed to process {bounds}")
    except Exception as e:
        print(f"  ❌ Error: {e}")
    print("-" * 40)

print("✅ Pre‑warming complete!")