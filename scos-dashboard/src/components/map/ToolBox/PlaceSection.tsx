import { ObstacleSelector } from '../../ObstacleSelector';
import { UnitSelector } from '../../UnitSelector';
import type { UnitAffiliation, UnitEchelon, UnitModifiers, UnitTypeCode } from '../../../types/units';
import type { ObstacleTypeCode } from '../../../types/obstacles';

interface PlaceSectionProps {
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
}

export function PlaceSection({
  obstacleType, setObstacleType, obstacleRadius, setObstacleRadius,
  unitType, setUnitType, unitAffiliation, setUnitAffiliation,
  unitEchelon, setUnitEchelon, unitModifiers, setUnitModifiers,
  unitPlacementMode, setUnitPlacementMode,
}: PlaceSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-md font-semibold text-[#e0e0c0] border-b border-[#5a5a3e] pb-1">Place</h3>
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <button
            onClick={() => setUnitPlacementMode(!unitPlacementMode)}
            className={`px-3 py-1 rounded transition ${
              unitPlacementMode
                ? 'bg-[#4b5320] text-[#e0e0c0]'
                : 'bg-[#2e3b2e] text-[#b0a080] hover:bg-[#4b5320] hover:text-[#e0e0c0]'
            }`}
          >
            {unitPlacementMode ? 'Units' : 'Obstacles'}
          </button>
          <span className="text-sm text-[#b0a080]">Mode</span>
        </div>
        {unitPlacementMode ? (
          <UnitSelector
            selectedType={unitType}
            onSelectType={(type) => {
              console.log('📦 PlaceSection received type:', type);
              setUnitType(type);
            }}
            selectedAffiliation={unitAffiliation}
            onSelectAffiliation={setUnitAffiliation}
            selectedEchelon={unitEchelon}
            onSelectEchelon={setUnitEchelon}
            selectedModifiers={unitModifiers}
            onSelectModifiers={setUnitModifiers}
          />
        ) : (
          <ObstacleSelector
            selectedType={obstacleType}
            onSelectType={setObstacleType}
            selectedRadius={obstacleRadius}
            onSelectRadius={setObstacleRadius}
          />
        )}
      </div>
    </div>
  );
}