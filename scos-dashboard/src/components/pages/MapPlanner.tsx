import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as turf from '@turf/turf';
import { MapView } from '../map/MapView';
import { Toolbox } from '../map/ToolBox/Toolbox';
import { PropertiesPanel } from '../map/PropertiesPanel';
import { StatusBar } from '../map/StatusBar';
import type { ModelType, Obstacle } from '../../types';
import { OBSTACLE_TYPES, type ObstacleTypeCode } from '../../types/obstacles';
import { UNIT_TYPES, type UnitTypeCode, type UnitAffiliation, type UnitMarker, type UnitEchelon, type UnitModifiers } from '../../types/units';
import type { MapControllerHandle } from '../MapController';
import { generateKMZ } from '../../utils/exportKMZ';

const STORAGE_KEY = 'scos_mapPlannerState';

// Helper functions for persistence
const loadSavedState = () => {
  const saved = sessionStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved state', e);
    }
  }
  return null;
};

const saveState = (state: any) => {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

// Helper: compute enemy movement corridor (returns polygon as [lat, lng] array)
function calculateCorridor(
  pos: [number, number],
  direction: number,
  speed: number,
  timeHorizon: number = 5 // minutes
): [number, number][] | null {
  if (!pos) return null;

  const [lat, lng] = pos;
  const dirRad = (direction * Math.PI) / 180;

  // Rough conversion: 1 deg lat ≈ 111 km, 1 deg lng ≈ 111 * cos(lat) km
  const distKm = speed * (timeHorizon / 60);
  const latPerKm = 1 / 111.0;
  const lngPerKm = 1 / (111.0 * Math.cos((lat * Math.PI) / 180));

  const coneAngle = 15 * (Math.PI / 180); // half‑angle (15°)
  const leftDir = dirRad - coneAngle;
  const rightDir = dirRad + coneAngle;

  const endLat = lat + distKm * latPerKm * Math.cos(dirRad);
  const endLng = lng + distKm * lngPerKm * Math.sin(dirRad);
  const leftEndLat = lat + distKm * latPerKm * Math.cos(leftDir);
  const leftEndLng = lng + distKm * lngPerKm * Math.sin(leftDir);
  const rightEndLat = lat + distKm * latPerKm * Math.cos(rightDir);
  const rightEndLng = lng + distKm * lngPerKm * Math.sin(rightDir);

  // Return polygon (closed)
  return [
    [lat, lng],
    [leftEndLat, leftEndLng],
    [endLat, endLng],
    [rightEndLat, rightEndLng],
    [lat, lng],
  ];
}

// Helper: extract bounding box from polygon
function getBboxFromPolygon(polygon: GeoJSON.Polygon): [number, number, number, number] {
  const coords = polygon.coordinates[0];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  coords.forEach(([lng, lat]) => {
    if (lng < minX) minX = lng;
    if (lng > maxX) maxX = lng;
    if (lat < minY) minY = lat;
    if (lat > maxY) maxY = lat;
  });
  return [minY, minX, maxY, maxX];
}

function generateMockObstacles(
  intensity: number,
  correlation: number,
  model: ModelType,
  bounds?: [number, number, number, number]
): Obstacle[] {
  if (!OBSTACLE_TYPES || Object.keys(OBSTACLE_TYPES).length === 0) {
    console.warn('OBSTACLE_TYPES is empty – returning no obstacles');
    return [];
  }

  const numObstacles = Math.floor(intensity * 30) + 5;
  const obstacles: Obstacle[] = [];
  let south = 51.5, west = -0.1, north = 51.51, east = -0.08;

  if (bounds) {
    [south, west, north, east] = bounds;
  }

  const minDist = 0.001 * (1 - correlation);
  const obstacleCodes = Object.keys(OBSTACLE_TYPES) as ObstacleTypeCode[];

  for (let i = 0; i < numObstacles; i++) {
    let attempts = 0;
    let placed = false;
    while (!placed && attempts < 100) {
      const lat = south + Math.random() * (north - south);
      const lng = west + Math.random() * (east - west);
      const typeCode = obstacleCodes[Math.floor(Math.random() * obstacleCodes.length)];
      const obstacleDef = OBSTACLE_TYPES[typeCode];

      if (!obstacleDef) continue;

      if (model === 'strauss') {
        const tooClose = obstacles.some(obs => {
          const dx = obs.lng - lng;
          const dy = obs.lat - lat;
          return Math.sqrt(dx*dx + dy*dy) < minDist;
        });
        if (!tooClose) {
          obstacles.push({
            id: `obs-${i}-${Date.now()}`,
            lat,
            lng,
            radius: obstacleDef.defaultRadius || Math.floor(Math.random() * 200 + 50),
            typeCode,
            typeName: obstacleDef.name,
          });
          placed = true;
        }
      } else {
        obstacles.push({
          id: `obs-${i}-${Date.now()}`,
          lat,
          lng,
          radius: obstacleDef.defaultRadius || Math.floor(Math.random() * 200 + 50),
          typeCode,
          typeName: obstacleDef.name,
        });
        placed = true;
      }
      attempts++;
    }
  }
  return obstacles;
}

export function MapPlanner() {
  const navigate = useNavigate();
  const saved = loadSavedState();

  // --- State initialisation with saved values ---
  const [intensity, setIntensity] = useState(saved?.intensity ?? 0.5);
  const [correlation, setCorrelation] = useState(saved?.correlation ?? 0.3);
  const [model, setModel] = useState<ModelType>(saved?.model ?? 'strauss');
  const [obstacles, setObstacles] = useState<Obstacle[]>(saved?.obstacles ?? generateMockObstacles(intensity, correlation, model));
  const [isGenerating, setIsGenerating] = useState(false);
  const [losActive, setLosActive] = useState(saved?.losActive ?? false);
  const [losPoints, setLosPoints] = useState<[number, number][]>(saved?.losPoints ?? []);
  const [losResult, setLosResult] = useState<{
    visible: boolean;
    line: GeoJSON.Feature<GeoJSON.LineString> | null;
  }>(saved?.losResult ?? { visible: false, line: null });
  const [selectedArea, setSelectedArea] = useState<GeoJSON.Polygon | null>(saved?.selectedArea ?? null);
  const [drawingEnabled, setDrawingEnabled] = useState(saved?.drawingEnabled ?? false);
  const [selectedObstacleType, setSelectedObstacleType] = useState<ObstacleTypeCode>(saved?.selectedObstacleType ?? 'OMP');
  const [selectedObstacleRadius, setSelectedObstacleRadius] = useState<number>(saved?.selectedObstacleRadius ?? (OBSTACLE_TYPES['OMP']?.defaultRadius || 100));
  const [units, setUnits] = useState<UnitMarker[]>(saved?.units ?? []);
  const [unitPlacementMode, setUnitPlacementMode] = useState(saved?.unitPlacementMode ?? false);
  const [selectedUnitType, setSelectedUnitType] = useState<UnitTypeCode>(saved?.selectedUnitType ?? 'I');
  const [selectedUnitAffiliation, setSelectedUnitAffiliation] = useState<UnitAffiliation>(saved?.selectedUnitAffiliation ?? 'friendly');
  const [selectedEchelon, setSelectedEchelon] = useState<UnitEchelon>(saved?.selectedEchelon ?? 'none');
  const [selectedModifiers, setSelectedModifiers] = useState<UnitModifiers>(saved?.selectedModifiers ?? { headquarters: false, taskForce: false });
  const [target, setTarget] = useState(saved?.target ?? 'mechanized infantry');
  const [effect, setEffect] = useState(saved?.effect ?? 'block');
  const [relativeLocation, setRelativeLocation] = useState(saved?.relativeLocation ?? 'avenue of approach');
  const [mission, setMission] = useState(saved?.mission ?? 'defend');
  const [troops, setTroops] = useState(saved?.troops ?? 'company');
  const [time, setTime] = useState(saved?.time ?? 'limited');
  const [civil, setCivil] = useState(saved?.civil ?? 'none');
  const [showTerrain, setShowTerrain] = useState(saved?.showTerrain ?? false);
  const [terrainImage, setTerrainImage] = useState<string | null>(saved?.terrainImage ?? null);
  const [terrainOpacity, setTerrainOpacity] = useState(saved?.terrainOpacity ?? 0.6);
  const [desiredPath, setDesiredPath] = useState<GeoJSON.LineString | null>(saved?.desiredPath ?? null);
  const [enemyPlacementMode, setEnemyPlacementMode] = useState(saved?.enemyPlacementMode ?? false);
  const [enemyPosition, setEnemyPosition] = useState<[number, number] | null>(saved?.enemyPosition ?? null);
  const [originalEnemyPosition, setOriginalEnemyPosition] = useState<[number, number] | null>(saved?.enemyPosition ?? null);
  const [enemyDirection, setEnemyDirection] = useState(saved?.enemyDirection ?? 0);
  const [enemySpeed, setEnemySpeed] = useState(saved?.enemySpeed ?? 30);
  const [enemyCorridor, setEnemyCorridor] = useState<[number, number][] | null>(saved?.enemyCorridor ?? null);
  const [isMoving, setIsMoving] = useState(saved?.isMoving ?? false);
  const [movementProgress, setMovementProgress] = useState(saved?.movementProgress ?? 0);
  const [movementInterval, setMovementInterval] = useState<number | null>(null);
  const [selectedObstacle, setSelectedObstacle] = useState<Obstacle | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<UnitMarker | null>(null);
  const [cursorLatLng, setCursorLatLng] = useState<{ lat: number; lng: number } | undefined>(saved?.cursorLatLng);
  const [toolboxCollapsed, setToolboxCollapsed] = useState(saved?.toolboxCollapsed ?? false);
  const mapRef = useRef<MapControllerHandle>(null);

  // --- Objective picker state ---
  const [objective, setObjective] = useState<[number, number] | null>(saved?.objective ?? null);
  const [objectivePlacementMode, setObjectivePlacementMode] = useState(false);

  // --- Path visualization state ---
  const [plannedPath, setPlannedPath] = useState<[number, number][] | null>(null);

  // Custom setter for unit type with logging
  const handleSetUnitType = (type: UnitTypeCode) => {
    console.log('🗺️ MapPlanner setting unit type to:', type);
    setSelectedUnitType(type);
  };

  // Log when selectedUnitType changes
  useEffect(() => {
    console.log('🔍 selectedUnitType changed to:', selectedUnitType);
  }, [selectedUnitType]);

  // Update enemy corridor when position/direction/speed changes
  useEffect(() => {
    if (enemyPosition) {
      const corridor = calculateCorridor(enemyPosition, enemyDirection, enemySpeed);
      console.log('Calculated enemy corridor:', corridor);
      setEnemyCorridor(corridor);
      if (!originalEnemyPosition) {
        setOriginalEnemyPosition(enemyPosition);
      }
    } else {
      setEnemyCorridor(null);
      setOriginalEnemyPosition(null);
    }
  }, [enemyPosition, enemyDirection, enemySpeed, originalEnemyPosition]);

  // Movement effect
  useEffect(() => {
    if (isMoving && enemyPosition && enemyCorridor) {
      const interval = window.setInterval(() => {
        setMovementProgress((prev: number) =>  {
          const next = prev + 1;
          if (next >= 100) {
            setIsMoving(false);
            if (movementInterval) {
              clearInterval(movementInterval);
              setMovementInterval(null);
            }
            return 0;
          }
          return next;
        });
      }, 100);
      setMovementInterval(interval);
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [isMoving, enemyPosition, enemyCorridor]);

  const getInterpolatedPosition = useCallback((): [number, number] | null => {
    if (!enemyPosition || !enemyCorridor || movementProgress === 0 || !originalEnemyPosition) {
      return enemyPosition;
    }
    return enemyPosition;
  }, [enemyPosition, enemyCorridor, movementProgress, originalEnemyPosition]);

  const handlePlayPause = useCallback(() => {
    if (!enemyPosition || !enemyCorridor) return;
    if (isMoving) {
      if (movementInterval) {
        clearInterval(movementInterval);
        setMovementInterval(null);
      }
      setIsMoving(false);
    } else {
      setIsMoving(true);
    }
  }, [isMoving, movementInterval, enemyPosition, enemyCorridor]);

  const handleStop = useCallback(() => {
    if (movementInterval) {
      clearInterval(movementInterval);
      setMovementInterval(null);
    }
    setIsMoving(false);
    setMovementProgress(0);
    if (originalEnemyPosition) {
      setEnemyPosition(originalEnemyPosition);
    }
  }, [movementInterval, originalEnemyPosition]);

  const handleResetMovement = useCallback(() => {
    handleStop();
    setMovementProgress(0);
    if (originalEnemyPosition) {
      setEnemyPosition(originalEnemyPosition);
    }
  }, [handleStop, originalEnemyPosition]);

  const handleToggleLOS = useCallback(() => {
    setLosActive((prev:boolean) => !prev);
    if (losActive) {
      setLosPoints([]);
      setLosResult({ visible: false, line: null });
    }
  }, [losActive]);

  const calculateLOS = useCallback(async (p1: [number, number], p2: [number, number]): Promise<boolean> => {
    const numSamples = 20;
    const line = turf.lineString([[p1[1], p1[0]], [p2[1], p2[0]]]);
    const distance = turf.length(line, { units: 'meters' });
    const step = distance / (numSamples - 1);

    const samplePoints: [number, number][] = [];
    for (let i = 0; i < numSamples; i++) {
      const along = turf.along(line, i * step, { units: 'meters' });
      samplePoints.push(along.geometry.coordinates as [number, number]);
    }

    const locations = samplePoints.map(([lng, lat]) => `${lat},${lng}`).join('|');

    try {
      const response = await fetch(
        `https://api.opentopodata.org/v1/test-dataset?locations=${locations}`
      );
      const data = await response.json();
      if (!data.results) return false;

      const elevations = data.results.map((r: any) => r.elevation);
      const observerElev = elevations[0] + 1.8;
      const targetElev = elevations[elevations.length - 1] + 1.8;

      for (let i = 1; i < elevations.length - 1; i++) {
        const frac = i / (elevations.length - 1);
        const lineElev = observerElev * (1 - frac) + targetElev * frac;
        if (elevations[i] > lineElev) return false;
      }
      return true;
    } catch (error) {
      console.error('LOS calculation failed:', error);
      return false;
    }
  }, []);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setCursorLatLng({ lat, lng });
    setSelectedObstacle(null);
    setSelectedUnit(null);
    console.log('Placing unit with type:', selectedUnitType);

    // Objective placement mode
    if (objectivePlacementMode) {
      setObjective([lat, lng]);
      setObjectivePlacementMode(false);
      return;
    }

    if (enemyPlacementMode) {
      setEnemyPosition([lat, lng]);
      setOriginalEnemyPosition([lat, lng]);
      setEnemyPlacementMode(false);
      return;
    }

    if (losActive) {
      const newPoints: [number, number][] = [...losPoints, [lat, lng]];
      if (newPoints.length > 2) {
        setLosPoints([[lat, lng]]);
        setLosResult({ visible: false, line: null });
      } else {
        setLosPoints(newPoints);
        if (newPoints.length === 2) {
          const [p1, p2] = newPoints;
          const visible = await calculateLOS(p1, p2);
          const line = turf.lineString([[p1[1], p1[0]], [p2[1], p2[0]]]);
          setLosResult({ visible, line });
        }
      }
      return;
    }

    if (unitPlacementMode) {
      const unitDef = UNIT_TYPES[selectedUnitType];
      if (!unitDef) {
        console.error(`Invalid unit type: ${selectedUnitType}`);
        return;
      }
      const newUnit: UnitMarker = {
        id: `unit-${Date.now()}`,
        lat,
        lng,
        typeCode: selectedUnitType,
        affiliation: selectedUnitAffiliation,
        name: unitDef.name,
        echelon: selectedEchelon,
        modifiers: selectedModifiers,
      };
      setUnits(prev => [...prev, newUnit]);
      return;
    }

    const obstacleDef = OBSTACLE_TYPES[selectedObstacleType];
    if (!obstacleDef) {
      console.error(`Invalid obstacle type: ${selectedObstacleType}`);
      return;
    }
    const newObstacle: Obstacle = {
      id: `manual-${Date.now()}`,
      lat,
      lng,
      radius: selectedObstacleRadius,
      typeCode: selectedObstacleType,
      typeName: obstacleDef.name,
    };
    setObstacles((prev) => [...prev, newObstacle]);
  }, [objectivePlacementMode, losActive, losPoints, unitPlacementMode, selectedUnitType, selectedUnitAffiliation, selectedEchelon, selectedModifiers, selectedObstacleType, selectedObstacleRadius, calculateLOS, enemyPlacementMode]);

  const handleRunSimulation = useCallback(async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('http://localhost:5000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intensity,
          correlation,
          model,
          bounds: selectedArea ? getBboxFromPolygon(selectedArea) : undefined,
          polygon: selectedArea,
          path: desiredPath?.coordinates,
          target,
          effect,
          relativeLocation,
          mett_tc: {
            mission,
            enemy: target,
            terrain: 'open',
            troops,
            time,
            civil,
          },
          enemy: enemyPosition ? {
            position: enemyPosition,
            direction: enemyDirection,
            speed: enemySpeed
          } : null,
          objective: objective,
        }),
      });
      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      // New response format: { obstacles, path }
      setObstacles(data.obstacles);
      setPlannedPath(data.path);
    } catch (error) {
      console.error('Failed to generate obstacles:', error);
      alert('Error connecting to AI backend. Make sure it is running on port 5000.');
    } finally {
      setIsGenerating(false);
    }
  }, [intensity, correlation, model, selectedArea, desiredPath, target, effect, relativeLocation, mission, troops, time, civil, enemyPosition, enemyDirection, enemySpeed, objective]);

  const handleReset = useCallback(() => {
    setIntensity(0.5);
    setCorrelation(0.3);
    setModel('strauss');
    setSelectedArea(null);
    setDrawingEnabled(false);
    setLosActive(false);
    setLosPoints([]);
    setLosResult({ visible: false, line: null });
    setObstacles(generateMockObstacles(0.5, 0.3, 'strauss'));
    setUnits([]);
    setUnitPlacementMode(false);
    setSelectedObstacleType('OMP');
    setSelectedObstacleRadius(OBSTACLE_TYPES['OMP']?.defaultRadius || 100);
    setSelectedUnitType('I');
    setSelectedUnitAffiliation('friendly');
    setSelectedEchelon('none');
    setSelectedModifiers({ headquarters: false, taskForce: false });
    setTarget('mechanized infantry');
    setEffect('block');
    setRelativeLocation('avenue of approach');
    setMission('defend');
    setTroops('company');
    setTime('limited');
    setCivil('none');
    setShowTerrain(false);
    setTerrainImage(null);
    setDesiredPath(null);
    setEnemyPosition(null);
    setOriginalEnemyPosition(null);
    setEnemyDirection(0);
    setEnemySpeed(30);
    setEnemyPlacementMode(false);
    setEnemyCorridor(null);
    setIsMoving(false);
    setMovementProgress(0);
    if (movementInterval) {
      clearInterval(movementInterval);
      setMovementInterval(null);
    }
    setSelectedObstacle(null);
    setSelectedUnit(null);
    setCursorLatLng(undefined);
    setObjective(null);
    setObjectivePlacementMode(false);
    setPlannedPath(null);
  }, []);

  const handleAreaSelected = useCallback((area: GeoJSON.Polygon | null) => {
    setSelectedArea(area);
    if (area) {
      const [south, west, north, east] = getBboxFromPolygon(area);
      mapRef.current?.flyToBounds([[south, west], [north, east]]);
      const newObstacles = generateMockObstacles(intensity, correlation, model, [south, west, north, east]);
      setObstacles(newObstacles);
    } else {
      const newObstacles = generateMockObstacles(intensity, correlation, model);
      setObstacles(newObstacles);
    }
  }, [intensity, correlation, model]);

  const handlePathDrawn = useCallback((path: GeoJSON.LineString) => {
    setDesiredPath(path);
    const coords = path.coordinates;
    const lats = coords.map(c => c[1]);
    const lngs = coords.map(c => c[0]);
    const bounds: [[number, number], [number, number]] = [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];
    mapRef.current?.flyToBounds(bounds);
  }, []);

  const handleExportKMZ = useCallback(async () => {
    try {
      const kmzBlob = await generateKMZ(obstacles, units);
      let filename = prompt('Enter filename for KMZ:', 'tactical_plan.kmz');
      if (!filename) return;
      if (!filename.endsWith('.kmz')) filename += '.kmz';
      
      const url = URL.createObjectURL(kmzBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate KMZ:', error);
      alert('Could not generate KMZ file');
    }
  }, [obstacles, units]);


  const fetchTerrainImage = useCallback(async () => {
    console.log('fetchTerrainImage called');
    if (!selectedArea) {
      alert('Please select an area first');
      return;
    }
    const bounds = getBboxFromPolygon(selectedArea);
    try {
      const response = await fetch('http://localhost:5000/api/terrain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bounds }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} – ${errorText}`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setTerrainImage(url);
    } catch (error) {
      console.error('Terrain fetch error:', error);
      let errorMessage = 'Could not load terrain data';
      if (error instanceof Error) errorMessage += ': ' + error.message;
      alert(errorMessage);
    }
  }, [selectedArea]);

  const handleToggleTerrain = useCallback(() => {
    if (!showTerrain && !terrainImage) fetchTerrainImage();
    setShowTerrain((prev :boolean )=> !prev);
  }, [showTerrain, terrainImage, fetchTerrainImage]);

  const boundsForOverlay = selectedArea ? (() => {
    const [s, w, n, e] = getBboxFromPolygon(selectedArea);
    return [[s, w], [n, e]] as [[number, number], [number, number]];
  })() : undefined;

  const handleDeleteObstacle = useCallback((id: string) => {
    setObstacles(prev => prev.filter(obs => obs.id !== id));
  }, []);

  const handleDeleteUnit = useCallback((id: string) => {
    setUnits(prev => prev.filter(unit => unit.id !== id));
  }, []);

  const goToSimulation = useCallback(() => {
    if (!selectedArea) {
      alert('Please select an area first (draw a polygon on the map).');
      return;
    }
    const bounds = getBboxFromPolygon(selectedArea);
    navigate('/simulation', {
      state: {
        obstacles,
        units,
        enemyPosition,
        bounds,
        path: plannedPath,
      
      },
    });
  }, [selectedArea, obstacles, units, enemyPosition, navigate, plannedPath]);

  const clearObjective = useCallback(() => setObjective(null), []);

  // --- Save/Load Scenario functions ---
  const handleSaveScenario = () => {
  const scenario = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    obstacles: obstacles,
    units: units,
    enemyPosition: enemyPosition,
    objective: objective,
    selectedArea: selectedArea,        // <-- added
    plannedPath: plannedPath,          // <-- added
    doctrinalParams: {
      target,
      effect,
      relativeLocation,
      mission,
      troops,
      time,
      civil,
    },
  };
  const dataStr = JSON.stringify(scenario, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `scenario_${new Date().toISOString().slice(0,19).replace(/:/g, "-")}.json`;
  a.click();
  URL.revokeObjectURL(url);
};


const handleLoadScenario = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string);
      
      // Restore core data
      if (data.obstacles) setObstacles(data.obstacles);
      if (data.units) setUnits(data.units);
      if (data.enemyPosition) setEnemyPosition(data.enemyPosition);
      if (data.objective) setObjective(data.objective);
      if (data.plannedPath) setPlannedPath(data.plannedPath);
      
      // Restore selected area and fly to it
      if (data.selectedArea) {
        setSelectedArea(data.selectedArea);
        const bounds = getBboxFromPolygon(data.selectedArea);
        mapRef.current?.flyToBounds([[bounds[0], bounds[1]], [bounds[2], bounds[3]]]);
      } else if (data.obstacles && data.obstacles.length > 0) {
        // Fallback: compute bounds from obstacles
        const lats = data.obstacles.map((o: Obstacle) => o.lat);
        const lngs = data.obstacles.map((o: Obstacle) => o.lng);
        const south = Math.min(...lats);
        const north = Math.max(...lats);
        const west = Math.min(...lngs);
        const east = Math.max(...lngs);
        mapRef.current?.flyToBounds([[south, west], [north, east]]);
      }
      
      // Restore doctrinal parameters
      if (data.doctrinalParams) {
        setTarget(data.doctrinalParams.target ?? target);
        setEffect(data.doctrinalParams.effect ?? effect);
        setRelativeLocation(data.doctrinalParams.relativeLocation ?? relativeLocation);
        setMission(data.doctrinalParams.mission ?? mission);
        setTroops(data.doctrinalParams.troops ?? troops);
        setTime(data.doctrinalParams.time ?? time);
        setCivil(data.doctrinalParams.civil ?? civil);
      }
      
      console.log("Scenario loaded", data);
    } catch (err) {
      console.error("Failed to parse scenario file", err);
      alert("Invalid scenario file");
    }
  };
  reader.readAsText(file);
  // Reset file input so same file can be loaded again
  event.target.value = "";
};

  // Persist state to sessionStorage whenever relevant state changes
  useEffect(() => {
    const stateToSave = {
      intensity,
      correlation,
      model,
      obstacles,
      losActive,
      losPoints,
      losResult,
      selectedArea,
      drawingEnabled,
      selectedObstacleType,
      selectedObstacleRadius,
      units,
      unitPlacementMode,
      selectedUnitType,
      selectedUnitAffiliation,
      selectedEchelon,
      selectedModifiers,
      target,
      effect,
      relativeLocation,
      mission,
      troops,
      time,
      civil,
      showTerrain,
      terrainImage,
      terrainOpacity,
      desiredPath,
      enemyPlacementMode,
      enemyPosition,
      enemyDirection,
      enemySpeed,
      enemyCorridor,
      isMoving,
      movementProgress,
      cursorLatLng,
      toolboxCollapsed,
      objective,
    };
    saveState(stateToSave);
  }, [
    intensity,
    correlation,
    model,
    obstacles,
    losActive,
    losPoints,
    losResult,
    selectedArea,
    drawingEnabled,
    selectedObstacleType,
    selectedObstacleRadius,
    units,
    unitPlacementMode,
    selectedUnitType,
    selectedUnitAffiliation,
    selectedEchelon,
    selectedModifiers,
    target,
    effect,
    relativeLocation,
    mission,
    troops,
    time,
    civil,
    showTerrain,
    terrainImage,
    terrainOpacity,
    desiredPath,
    enemyPlacementMode,
    enemyPosition,
    enemyDirection,
    enemySpeed,
    enemyCorridor,
    isMoving,
    movementProgress,
    cursorLatLng,
    toolboxCollapsed,
    objective,
  ]);

  return (
    <div className="flex flex-col h-full bg-[#2e3b2e]">
      <div className="flex flex-1 overflow-hidden">
        <Toolbox
          obstacleType={selectedObstacleType}
          setObstacleType={setSelectedObstacleType}
          obstacleRadius={selectedObstacleRadius}
          setObstacleRadius={setSelectedObstacleRadius}
          unitType={selectedUnitType}
          setUnitType={handleSetUnitType}
          unitAffiliation={selectedUnitAffiliation}
          setUnitAffiliation={setSelectedUnitAffiliation}
          unitEchelon={selectedEchelon}
          setUnitEchelon={setSelectedEchelon}
          unitModifiers={selectedModifiers}
          setUnitModifiers={setSelectedModifiers}
          unitPlacementMode={unitPlacementMode}
          setUnitPlacementMode={setUnitPlacementMode}
          drawingEnabled={drawingEnabled}
          setDrawingEnabled={setDrawingEnabled}
          onAreaSelected={handleAreaSelected}
          onClearAll={handleReset}
          losActive={losActive}
          setLosActive={handleToggleLOS}
          onGenerateAI={handleRunSimulation}
          onReset={handleReset}
          isGenerating={isGenerating}
          showTerrain={showTerrain}
          setShowTerrain={handleToggleTerrain}
          terrainOpacity={terrainOpacity}
          setTerrainOpacity={setTerrainOpacity}
          target={target}
          setTarget={setTarget}
          effect={effect}
          setEffect={setEffect}
          relativeLocation={relativeLocation}
          setRelativeLocation={setRelativeLocation}
          mission={mission}
          setMission={setMission}
          troops={troops}
          setTroops={setTroops}
          time={time}
          setTime={setTime}
          civil={civil}
          setCivil={setCivil}
          enemyPosition={enemyPosition}
          setEnemyPosition={setEnemyPosition}
          enemyDirection={enemyDirection}
          setEnemyDirection={setEnemyDirection}
          enemySpeed={enemySpeed}
          setEnemySpeed={setEnemySpeed}
          enemyPlacementMode={enemyPlacementMode}
          setEnemyPlacementMode={setEnemyPlacementMode}
          isMoving={isMoving}
          setIsMoving={setIsMoving}
          movementProgress={movementProgress}
          setMovementProgress={setMovementProgress}
          onPlayPause={handlePlayPause}
          onStop={handleStop}
          onResetMovement={handleResetMovement}
          collapsed={toolboxCollapsed}
          onCollapseChange={setToolboxCollapsed}
          objective={objective}
          setObjective={setObjective}
          objectivePlacementMode={objectivePlacementMode}
          setObjectivePlacementMode={setObjectivePlacementMode}
          clearObjective={clearObjective}
        />

        <div className="flex-1 relative">
          <div className="absolute top-4 right-4 z-[1000] flex space-x-2">
            <button
              onClick={handleSaveScenario}
              className="bg-[#4b5320] text-[#e0e0c0] px-3 py-2 rounded shadow-lg hover:bg-[#3a4018] transition"
              title="Save current scenario"
            >
              💾 Save
            </button>
            <label className="bg-[#4b5320] text-[#e0e0c0] px-3 py-2 rounded shadow-lg hover:bg-[#3a4018] transition cursor-pointer">
              📂 Load
              <input type="file" accept=".json" onChange={handleLoadScenario} className="hidden" />
            </label>
            <button
              onClick={handleExportKMZ}
              className="bg-[#4b5320] text-[#e0e0c0] px-3 py-2 rounded shadow-lg hover:bg-[#3a4018] transition"
              title="Export as KMZ (Google Earth)"
            >
              📁 KMZ
            </button>
            <button
              onClick={goToSimulation}
              className="bg-[#4b5320] text-[#e0e0c0] px-4 py-2 rounded shadow-lg hover:bg-[#3a4018] transition"
            >
              Simulate
            </button>
          </div>

          <MapView
            ref={mapRef}
            obstacles={obstacles}
            units={units}
            onMapClick={handleMapClick}
            onDeleteObstacle={handleDeleteObstacle}
            onDeleteUnit={handleDeleteUnit}
            losLine={losResult.line}
            losVisible={losResult.visible}
            drawingEnabled={drawingEnabled}
            onAreaDrawn={handleAreaSelected}
            onPathDrawn={handlePathDrawn}
            terrainImage={showTerrain ? terrainImage : null}
            terrainBounds={boundsForOverlay}
            showTerrain={showTerrain}
            enemyMarker={enemyPosition ? { 
              position: getInterpolatedPosition() || enemyPosition, 
              direction: enemyDirection 
            } : null}
            enemyCorridor={enemyCorridor}
            objective={objective}
            plannedPath={plannedPath}
            selectedArea={selectedArea}
          />

          <PropertiesPanel
            className="absolute bottom-4 right-4 z-[1000] pointer-events-auto"
            selectedObstacle={selectedObstacle}
            selectedUnit={selectedUnit}
            cursorLatLng={cursorLatLng}
            
          />
        </div>
      </div>

      <StatusBar
        cursorLatLng={cursorLatLng}
        obstacleCount={obstacles.length}
        unitCount={units.length}
        message={selectedArea ? 'Area selected' : undefined}
      />
    </div>
  );
}
