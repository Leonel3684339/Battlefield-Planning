import { useState } from 'react';
import type { Obstacle } from '../../types';
import type { UnitMarker } from '../../types/units';
import { OBSTACLE_TYPES } from '../../types/obstacles';

interface PropertiesPanelProps {
  selectedObstacle?: Obstacle | null;
  selectedUnit?: UnitMarker | null;
  terrainLegend?: { go: number; slowGo: number; noGo: number };
  cursorLatLng?: { lat: number; lng: number };
  className?: string;
}

export function PropertiesPanel({ selectedObstacle, selectedUnit, cursorLatLng, className }: PropertiesPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`bg-[#3f4f3f] border border-[#5a5a3e] rounded-lg shadow-lg ${collapsed ? 'w-12' : 'w-80'} ${className}`}>
      <div className="flex justify-between items-center p-2 border-b border-[#5a5a3e]">
        <span className="font-semibold text-[#e0e0c0]">{!collapsed && 'Properties'}</span>
        <button onClick={() => setCollapsed(!collapsed)} className="text-[#e0e0c0] hover:text-[#8b7d6b]">
          {collapsed ? '▶' : '◀'}
        </button>
      </div>
      {!collapsed && (
        <div className="p-3 space-y-3 text-sm text-[#b0a080]">
          {selectedObstacle ? (
            <div>
              <h4 className="font-semibold text-[#e0e0c0]">Obstacle</h4>
              <p>Type: {selectedObstacle.typeName}</p>
              <p>Radius: {selectedObstacle.radius}m</p>
              <p>Doctrinal Purpose: {OBSTACLE_TYPES[selectedObstacle.typeCode]?.doctrinalPurpose}</p>
            </div>
          ) : selectedUnit ? (
            <div>
              <h4 className="font-semibold text-[#e0e0c0]">Unit</h4>
              <p>Type: {selectedUnit.name}</p>
              <p>Affiliation: {selectedUnit.affiliation}</p>
              {selectedUnit.echelon && <p>Size: {selectedUnit.echelon}</p>}
              {selectedUnit.modifiers?.headquarters && <p>Headquarters</p>}
              {selectedUnit.modifiers?.taskForce && <p>Task Force</p>}
            </div>
          ) : (
            <div>
              <h4 className="font-semibold text-[#e0e0c0]">Terrain Legend</h4>
              <div className="space-y-1 mt-2">
                <div className="flex items-center"><span className="w-4 h-4 bg-green-500 mr-2"></span> UNRESTRICTED</div>
                <div className="flex items-center"><span className="w-4 h-4 bg-yellow-500 mr-2"></span> RESTRICTED </div>
                <div className="flex items-center"><span className="w-4 h-4 bg-red-500 mr-2"></span> SEVERELY RESTRICTED </div>
              </div>
              {cursorLatLng && (
                <div className="mt-3">
                  <p>Cursor: {cursorLatLng.lat.toFixed(5)}, {cursorLatLng.lng.toFixed(5)}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
