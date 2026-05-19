import { useState, useEffect } from 'react';
import { PlaceSection } from './PlaceSection';
import { AnalysisSection } from './AnalysisSection';
import { TerrainSection } from './TerrainSection';
import { DoctrineSection } from './DoctrineSection';
import { EnemySection } from './EnemySection';
import { LocationSelector } from '../../LocationSelector';
import type { UnitAffiliation, UnitEchelon, UnitModifiers, UnitTypeCode } from '../../../types/units';
import type { ObstacleTypeCode } from '../../../types/obstacles';

interface ToolboxProps {
  obstacleType: ObstacleTypeCode;
  setObstacleType: (type: ObstacleTypeCode) => void;
  obstacleRadius: number;
  setObstacleRadius: (radius: number) => void;
  unitType: UnitTypeCode;
  setUnitType: (type: UnitTypeCode) => void;
  unitAffiliation: UnitAffiliation;
  setUnitAffiliation: (aff: UnitAffiliation) => void;
  unitEchelon: UnitEchelon;
  setUnitEchelon: (echelon: UnitEchelon) => void;
  unitModifiers: UnitModifiers;
  setUnitModifiers: (mods: UnitModifiers) => void;
  unitPlacementMode: boolean;
  setUnitPlacementMode: (active: boolean) => void;
  drawingEnabled: boolean;
  setDrawingEnabled: (active: boolean) => void;
  onAreaSelected: (area: GeoJSON.Polygon | null) => void;
  onClearAll?: () => void;
  losActive: boolean;
  setLosActive: (active: boolean) => void;
  onGenerateAI: () => void;
  onReset: () => void;
  isGenerating: boolean;
  showTerrain: boolean;
  setShowTerrain: (active: boolean) => void;
  terrainOpacity?: number;
  setTerrainOpacity?: (opacity: number) => void;
  target: string;
  setTarget: (value: string) => void;
  effect: string;
  setEffect: (value: string) => void;
  relativeLocation: string;
  setRelativeLocation: (value: string) => void;
  mission: string;
  setMission: (value: string) => void;
  troops: string;
  setTroops: (value: string) => void;
  time: string;
  setTime: (value: string) => void;
  civil: string;
  setCivil: (value: string) => void;
  enemyPosition: [number, number] | null;
  setEnemyPosition: (pos: [number, number] | null) => void;
  enemyDirection: number;
  setEnemyDirection: (dir: number) => void;
  enemySpeed: number;
  setEnemySpeed: (speed: number) => void;
  enemyPlacementMode: boolean;
  setEnemyPlacementMode: (mode: boolean) => void;
  // Movement props
  isMoving: boolean;
  setIsMoving: (moving: boolean) => void;
  movementProgress: number;
  setMovementProgress: (progress: number) => void;
  onPlayPause: () => void;
  onStop: () => void;
  onResetMovement: () => void;
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
  // Objective props
  objective: [number, number] | null;
  setObjective: (pos: [number, number] | null) => void;
  objectivePlacementMode: boolean;
  setObjectivePlacementMode: (mode: boolean) => void;
  clearObjective: () => void;
}

export function Toolbox({
  obstacleType, setObstacleType, obstacleRadius, setObstacleRadius,
  unitType, setUnitType, unitAffiliation, setUnitAffiliation,
  unitEchelon, setUnitEchelon, unitModifiers, setUnitModifiers,
  unitPlacementMode, setUnitPlacementMode,
  drawingEnabled, setDrawingEnabled, onAreaSelected, onClearAll,
  losActive, setLosActive, onGenerateAI, onReset, isGenerating,
  showTerrain, setShowTerrain, terrainOpacity = 0.6, setTerrainOpacity,
  target, setTarget, effect, setEffect, relativeLocation, setRelativeLocation,
  mission, setMission, troops, setTroops, time, setTime, civil, setCivil,
  enemyPosition, setEnemyPosition, enemyDirection, setEnemyDirection,
  enemySpeed, setEnemySpeed, enemyPlacementMode, setEnemyPlacementMode,
  isMoving, setIsMoving, movementProgress, setMovementProgress,
  onPlayPause, onStop, onResetMovement,
  collapsed: externalCollapsed,
  onCollapseChange,
  objective, objectivePlacementMode, setObjectivePlacementMode, clearObjective,
}: ToolboxProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(externalCollapsed || false);

  useEffect(() => {
    if (externalCollapsed !== undefined) {
      setInternalCollapsed(externalCollapsed);
    }
  }, [externalCollapsed]);

  const handleCollapse = () => {
    const newCollapsed = !internalCollapsed;
    setInternalCollapsed(newCollapsed);
    onCollapseChange?.(newCollapsed);
  };

  return (
    <div className={`bg-[#3f4f3f] border-r border-[#5a5a3e] transition-all duration-300 ${internalCollapsed ? 'w-16' : 'w-80'} flex flex-col`}>
      <button
        onClick={handleCollapse}
        className="p-2 text-[#e0e0c0] hover:bg-[#4b5320] border-b border-[#5a5a3e]"
      >
        {internalCollapsed ? '→' : '← Collapse'}
      </button>

      {!internalCollapsed && (
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <LocationSelector
            onAreaSelected={onAreaSelected}
            onDrawingMode={setDrawingEnabled}
            isDrawing={drawingEnabled}
          />

          <DoctrineSection
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
          />

          <EnemySection
            enemyPosition={enemyPosition}
            setEnemyPosition={setEnemyPosition}
            enemyDirection={enemyDirection}
            setEnemyDirection={setEnemyDirection}
            enemySpeed={enemySpeed}
            setEnemySpeed={setEnemySpeed}
            placementMode={enemyPlacementMode}
            setPlacementMode={setEnemyPlacementMode}
            isMoving={isMoving}
            setIsMoving={setIsMoving}
            movementProgress={movementProgress}
            setMovementProgress={setMovementProgress}
            onPlayPause={onPlayPause}
            onStop={onStop}
            onReset={onResetMovement}
          />

          {/* New Objective Section */}
          <div className="space-y-3">
            <h3 className="text-md font-semibold text-[#e0e0c0] border-b border-[#5a5a3e] pb-1">Objective</h3>
            <button
              onClick={() => setObjectivePlacementMode(!objectivePlacementMode)}
              className={`w-full px-3 py-2 rounded transition ${
                objectivePlacementMode
                  ? 'bg-[#4b5320] text-[#e0e0c0]'
                  : 'bg-[#2e3b2e] text-[#b0a080] hover:bg-[#4b5320] hover:text-[#e0e0c0]'
              }`}
            >
              {objectivePlacementMode ? 'Click map to set objective' : 'Set Objective'}
            </button>
            {objective && (
              <div className="text-sm text-[#b0a080]">
                Objective: {objective[0].toFixed(5)}, {objective[1].toFixed(5)}
                <button onClick={clearObjective} className="ml-2 text-red-500">Clear</button>
              </div>
            )}
          </div>

          <PlaceSection
            obstacleType={obstacleType}
            setObstacleType={setObstacleType}
            obstacleRadius={obstacleRadius}
            setObstacleRadius={setObstacleRadius}
            unitType={unitType}
            setUnitType={(type) => {
              console.log('🛠️ Toolbox setUnitType:', type);
              setUnitType(type);
            }}
            unitAffiliation={unitAffiliation}
            setUnitAffiliation={setUnitAffiliation}
            unitEchelon={unitEchelon}
            setUnitEchelon={setUnitEchelon}
            unitModifiers={unitModifiers}
            setUnitModifiers={setUnitModifiers}
            unitPlacementMode={unitPlacementMode}
            setUnitPlacementMode={setUnitPlacementMode}
          />

          <AnalysisSection
            losActive={losActive}
            setLosActive={setLosActive}
            onGenerateAI={onGenerateAI}
            onReset={onReset}
            isGenerating={isGenerating}
            onClearAll={onClearAll}
          />

          <TerrainSection
            showTerrain={showTerrain}
            setShowTerrain={setShowTerrain}
            opacity={terrainOpacity}
            setOpacity={setTerrainOpacity}
          />
        </div>
      )}
    </div>
  );
}
