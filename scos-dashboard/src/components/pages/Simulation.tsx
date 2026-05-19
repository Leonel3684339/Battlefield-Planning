import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Polyline,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { aStar } from '../../utils/pathfinding';
import type { Obstacle } from '../../types';
import type { UnitMarker } from '../../types/units';
import { createObstacleSymbol, createUnitSymbol } from '../../utils/militarySymbols';

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface Point {
  lat: number;
  lng: number;
}

interface PathResult {
  path: Point[];
  cost: number;
  travelTime?: number;
  distance?: number;
}

interface ObstacleEffect {
  obstacleId: string;
  obstacleName: string;
  lat: number;
  lng: number;
  distanceAtEncounter: number;
  delaySeconds: number;
}

function createIconFromSvg(svg: string): L.DivIcon {
  return L.divIcon({
    html: `<div class="military-marker" style="width: 40px; height: 40px;">${svg}</div>`,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function getObstacleEffect(obstacle: Obstacle): { delayFixed: number } {
  if (obstacle.typeCode.startsWith('OM')) return { delayFixed: 30 };
  if (obstacle.typeCode === 'OBBT') return { delayFixed: 45 };
  if (obstacle.typeCode.startsWith('OBW')) return { delayFixed: 15 };
  return { delayFixed: 20 };
}

// Correct MapClickHandler with proper cleanup
function MapClickHandler({ onMapClick }: { onMapClick: (e: L.LeafletMouseEvent) => void }) {
  const map = useMap();
  useEffect(() => {
    map.on('click', onMapClick);
    return () => {
      map.off('click', onMapClick);
    };
  }, [map, onMapClick]);
  return null;
}

export function Simulation() {
  const location = useLocation();
  const state = location.state as {
    obstacles: Obstacle[];
    units: UnitMarker[];
    enemyPosition: [number, number] | null;
    bounds: [number, number, number, number];
    path?: [number, number][]; // path from MapPlanner (lat, lng pairs)
  } | undefined;

  const [obstacles] = useState<Obstacle[]>(state?.obstacles || []);
  const [units] = useState<UnitMarker[]>(state?.units || []);
  const [enemyPos] = useState<[number, number] | null>(state?.enemyPosition || null);
  const [bounds, setBounds] = useState<[number, number, number, number] | undefined>(state?.bounds);
  const [destPoint, setDestPoint] = useState<Point | null>(null);
  const [speed, setSpeed] = useState<number>(30);
  const [pathResult, setPathResult] = useState<PathResult | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [currentPos, setCurrentPos] = useState<Point | null>(null);
  const [terrainGrid, setTerrainGrid] = useState<{ grid: number[][]; bounds: [number, number, number, number]; size: number } | null>(null);
  const [placementMode, setPlacementMode] = useState<'none' | 'destination'>('none');
  const [destLatInput, setDestLatInput] = useState('');
  const [destLngInput, setDestLngInput] = useState('');
  const [report, setReport] = useState<{ effects: ObstacleEffect[]; totalTime: number; totalDistance: number } | null>(null);
  const animationRef = useRef<number | undefined>(undefined);

  // If a path was passed from MapPlanner, we use it directly (no terrain grid needed)
  const hasProvidedPath = state?.path && state.path.length > 0;

  const fetchTerrainGrid = useCallback(async (b: [number, number, number, number]) => {
    if (hasProvidedPath) return; // no need to fetch if we already have path
    try {
      const response = await fetch('http://localhost:5000/api/terrain/grid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bounds: b, grid_size: 100 }),
      });
      if (!response.ok) throw new Error('Failed to fetch terrain');
      const data = await response.json();
      setTerrainGrid({
        grid: data.impedance,
        bounds: data.bounds,
        size: data.grid_size,
      });
    } catch (err) {
      console.error(err);
      alert('Could not load terrain grid');
    } finally {
      // keep fetch errors visible without blocking the rest of the simulation UI
    }
  }, [hasProvidedPath]);

  useEffect(() => {
    if (hasProvidedPath) return;
    if (bounds) {
      fetchTerrainGrid(bounds);
    } else {
      const defaultBounds: [number, number, number, number] = [49.18, 11.67, 49.42, 11.98];
      setBounds(defaultBounds);
      fetchTerrainGrid(defaultBounds);
    }
  }, [bounds, fetchTerrainGrid, hasProvidedPath]);

  // Compute path (either from provided path or via terrain grid)
  useEffect(() => {
    // If we have a path from MapPlanner, use it
    if (hasProvidedPath && state?.path) {
      const pathPoints: Point[] = state.path.map(([lat, lng]) => ({ lat, lng }));
      // Calculate total distance and time
      let totalDist = 0;
      for (let i = 1; i < pathPoints.length; i++) {
        const p1 = pathPoints[i-1];
        const p2 = pathPoints[i];
        const dx = (p2.lng - p1.lng) * 111000 * Math.cos((p1.lat + p2.lat) * Math.PI / 360);
        const dy = (p2.lat - p1.lat) * 111000;
        totalDist += Math.hypot(dx, dy);
      }
      const timeSec = totalDist / (speed * 1000 / 3600);
      setPathResult({
        path: pathPoints,
        cost: 0,
        distance: totalDist,
        travelTime: timeSec,
      });
      setCurrentPos(enemyPos ? { lat: enemyPos[0], lng: enemyPos[1] } : null);
      setReport(null);
      return;
    }

    // Otherwise compute path using terrain grid
    if (!destPoint || !enemyPos || !terrainGrid || !bounds) return;

    const { grid, bounds: gridBounds, size } = terrainGrid;
    const [south, west, north, east] = gridBounds;
    const latToIdx = (lat: number) => Math.floor(Math.min(size-1, Math.max(0, (lat - south) / (north - south) * size)));
    const lngToIdx = (lng: number) => Math.floor(Math.min(size-1, Math.max(0, (lng - west) / (east - west) * size)));
    const startIdx = { x: lngToIdx(enemyPos[1]), y: latToIdx(enemyPos[0]) };
    const goalIdx = { x: lngToIdx(destPoint.lng), y: latToIdx(destPoint.lat) };
    const { path: idxPath, cost } = aStar(grid, startIdx, goalIdx, false);
    if (idxPath.length === 0) {
      alert('No path found!');
      setPathResult(null);
      return;
    }
    const pathPoints: Point[] = idxPath.map(p => ({
      lat: south + (p.y + 0.5) * (north - south) / size,
      lng: west + (p.x + 0.5) * (east - west) / size,
    }));
    const cellSizeLat = (north - south) * 111000 / size;
    const cellSizeLng = (east - west) * 111000 * Math.cos((south + north) * Math.PI / 360) / size;
    const cellSize = (cellSizeLat + cellSizeLng) / 2;
    const distance = cost * cellSize;
    const timeSec = distance / (speed * 1000 / 3600);
    setPathResult({ path: pathPoints, cost, distance, travelTime: timeSec });
    setCurrentPos(enemyPos ? { lat: enemyPos[0], lng: enemyPos[1] } : null);
    setReport(null);
  }, [destPoint, enemyPos, terrainGrid, bounds, speed, hasProvidedPath, state]);

  // Animation with obstacle effect detection
  useEffect(() => {
    if (!isAnimating || !pathResult || !pathResult.path.length) return;
    const totalSteps = pathResult.path.length - 1;
    const duration = (pathResult.travelTime || 0) * 1000;
    let startTime = performance.now();
    const encountered = new Set<string>();
    const effects: ObstacleEffect[] = [];
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const step = Math.floor(t * totalSteps);
      const current = pathResult.path[step];
      setCurrentPos(current);
      if (current) {
        for (const obs of obstacles) {
          const dx = (obs.lng - current.lng) * 111000 * Math.cos(current.lat * Math.PI / 180);
          const dy = (obs.lat - current.lat) * 111000;
          if (Math.hypot(dx, dy) < 100 && !encountered.has(obs.id)) {
            encountered.add(obs.id);
            const { delayFixed } = getObstacleEffect(obs);
            const distanceTraveled = (pathResult.distance || 0) * t;
            effects.push({
              obstacleId: obs.id,
              obstacleName: obs.typeName || obs.typeCode,
              lat: obs.lat,
              lng: obs.lng,
              distanceAtEncounter: distanceTraveled,
              delaySeconds: delayFixed,
            });
          }
        }
      }
      if (t < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        cancelAnimationFrame(animationRef.current!);
        const totalDelay = effects.reduce((s, e) => s + e.delaySeconds, 0);
        setReport({ effects, totalTime: (pathResult.travelTime || 0) + totalDelay, totalDistance: pathResult.distance || 0 });
      }
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current!);
  }, [isAnimating, pathResult, obstacles]);

  const startAnimation = () => {
    if (pathResult && pathResult.path.length > 0 && !isAnimating) setIsAnimating(true);
  };
  const resetPoints = () => {
    setDestPoint(null);
    setPathResult(null);
    setCurrentPos(null);
    setIsAnimating(false);
    setReport(null);
  };
  const setDestinationFromClick = (e: L.LeafletMouseEvent) => {
    if (placementMode === 'destination') {
      setDestPoint({ lat: e.latlng.lat, lng: e.latlng.lng });
      setPlacementMode('none');
    }
  };
  const setDestinationFromCoordinates = () => {
    const lat = parseFloat(destLatInput);
    const lng = parseFloat(destLngInput);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert('Invalid coordinates');
      return;
    }
    setDestPoint({ lat, lng });
  };
  const formatTime = (sec?: number) => {
    if (!sec) return '—';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}m ${secs}s`;
  };
  const obstacleIcons = obstacles.map(obs => {
    const svg = createObstacleSymbol(obs.typeCode);
    return svg ? createIconFromSvg(svg) : null;
  });
  const unitIcons = units.map(unit => {
    const svg = createUnitSymbol(unit.typeCode, unit.affiliation, unit.echelon, unit.modifiers);
    return svg ? createIconFromSvg(svg) : null;
  });

  if (!bounds) {
    return <div className="p-4 text-white">No area selected. Please go back to Map Planner and select an area first.</div>;
  }

  return (
    <div className="flex flex-col h-full bg-[#2e3b2e]">
      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 bg-[#3f4f3f] border-r border-[#5a5a3e] p-4 overflow-y-auto">
          <h2 className="text-xl font-bold text-[#e0e0c0] mb-4">Simulation Controls</h2>
          <div className="space-y-4">
            <div><label className="block text-[#b0a080] mb-1">Start Point (Enemy)</label><div className="text-[#e0e0c0] text-sm">{enemyPos ? `${enemyPos[0].toFixed(5)}, ${enemyPos[1].toFixed(5)}` : 'No enemy placed'}</div></div>
            <div><label className="block text-[#b0a080] mb-1">Destination</label>{destPoint ? <div className="text-[#e0e0c0] text-sm">{destPoint.lat.toFixed(5)}, {destPoint.lng.toFixed(5)}</div> : <div className="text-[#e0e0c0] text-sm">Not set</div>}
              <div className="flex space-x-2 mt-2"><button onClick={() => setPlacementMode(placementMode === 'destination' ? 'none' : 'destination')} className={`px-3 py-1 rounded text-sm ${placementMode === 'destination' ? 'bg-[#4b5320] text-[#e0e0c0]' : 'bg-[#2e3b2e] text-[#b0a080]'}`}>{placementMode === 'destination' ? 'Click map to set' : 'Set by click'}</button></div>
            </div>
            <div><label className="block text-[#b0a080] mb-1">Or enter coordinates</label><div className="flex space-x-2"><input type="text" placeholder="Latitude" value={destLatInput} onChange={e => setDestLatInput(e.target.value)} className="w-1/2 px-2 py-1 rounded bg-[#2e3b2e] text-[#e0e0c0] border border-[#5a5a3e]"/><input type="text" placeholder="Longitude" value={destLngInput} onChange={e => setDestLngInput(e.target.value)} className="w-1/2 px-2 py-1 rounded bg-[#2e3b2e] text-[#e0e0c0] border border-[#5a5a3e]"/><button onClick={setDestinationFromCoordinates} className="px-3 py-1 bg-[#2e3b2e] text-[#b0a080] hover:bg-[#4b5320] rounded text-sm">Set</button></div></div>
            <div><label className="block text-[#b0a080] mb-1">Speed (km/h)</label><input type="number" value={speed} onChange={e => setSpeed(Number(e.target.value))} className="w-full px-2 py-1 rounded bg-[#2e3b2e] text-[#e0e0c0] border border-[#5a5a3e]" step="5" min="0"/></div>
            <button onClick={resetPoints} className="w-full px-3 py-2 bg-[#2e3b2e] text-[#b0a080] hover:bg-[#4b5320] rounded transition">Reset Destination</button>
            <button onClick={startAnimation} disabled={!pathResult || isAnimating} className={`w-full px-3 py-2 rounded transition ${!pathResult || isAnimating ? 'bg-gray-600 cursor-not-allowed text-gray-300' : 'bg-[#4b5320] text-[#e0e0c0] hover:bg-[#3a4018]'}`}>{isAnimating ? 'Animating...' : 'Start Simulation'}</button>
            {pathResult && !isAnimating && (<div className="mt-4 p-3 bg-[#2e3b2e] rounded border border-[#5a5a3e]"><h3 className="text-[#e0e0c0] font-semibold mb-2">Path Info</h3><div className="text-sm space-y-1 text-[#b0a080]"><div>Distance: {pathResult.distance ? (pathResult.distance / 1000).toFixed(2) : '—'} km</div><div>Est. time (no obstacles): {formatTime(pathResult.travelTime)}</div></div></div>)}
            {report && (<div className="mt-4 p-3 bg-[#2e3b2e] rounded border border-[#5a5a3e]"><h3 className="text-[#e0e0c0] font-semibold mb-2">Simulation Report</h3><div className="text-sm space-y-1 text-[#b0a080]"><div>Total distance: {(report.totalDistance / 1000).toFixed(2)} km</div><div>Total time: {formatTime(report.totalTime)}</div><div>Obstacles encountered: {report.effects.length}</div>{report.effects.length > 0 && <ul className="list-disc pl-4 mt-1">{report.effects.map((eff, idx) => <li key={idx}>{eff.obstacleName} at {eff.distanceAtEncounter.toFixed(0)}m – delay {eff.delaySeconds}s</li>)}</ul>}</div></div>)}
          </div>
        </div>
        <div className="flex-1 relative">
          <MapContainer center={[(bounds[0]+bounds[2])/2, (bounds[1]+bounds[3])/2]} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'/>
            <MapClickHandler onMapClick={setDestinationFromClick} />
            {obstacles.map((obs, idx) => { const icon = obstacleIcons[idx]; return icon ? <Marker key={obs.id} position={[obs.lat, obs.lng]} icon={icon}><Popup><strong>{obs.typeName || obs.typeCode}</strong><br/>Radius: {obs.radius}m</Popup></Marker> : null; })}
            {units.map((unit, idx) => { const icon = unitIcons[idx]; return icon ? <Marker key={unit.id} position={[unit.lat, unit.lng]} icon={icon}><Popup><strong>{unit.name || unit.typeCode}</strong><br/>Affiliation: {unit.affiliation}</Popup></Marker> : null; })}
            {enemyPos && <Marker position={[enemyPos[0], enemyPos[1]]}><Popup>Enemy Start</Popup></Marker>}
            {destPoint && <Marker position={[destPoint.lat, destPoint.lng]}><Popup>Destination</Popup></Marker>}
            {currentPos && <Marker position={[currentPos.lat, currentPos.lng]}><Popup>Moving Enemy</Popup></Marker>}
            {pathResult && pathResult.path.length > 0 && <Polyline positions={pathResult.path.map(p => [p.lat, p.lng])} color="blue" weight={4} opacity={0.8}/>}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
