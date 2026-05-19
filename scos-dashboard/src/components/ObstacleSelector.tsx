import { useState, useEffect } from 'react';
import { OBSTACLE_FAMILIES, OBSTACLE_TYPES, type ObstacleTypeCode } from '../types/obstacles';

interface ObstacleSelectorProps {
  selectedType: ObstacleTypeCode;
  onSelectType: (type: ObstacleTypeCode) => void;
  selectedRadius: number;
  onSelectRadius: (radius: number) => void;
}

export function ObstacleSelector({
  selectedType,
  onSelectType,
  selectedRadius,
  onSelectRadius,
}: ObstacleSelectorProps) {
  const [selectedFamily, setSelectedFamily] = useState<string>('wire');

  // Log when props change
  useEffect(() => {
    console.log('ObstacleSelector received selectedType:', selectedType);
  }, [selectedType]);

  // When family changes, pick the first type in that family
  useEffect(() => {
    console.log('Family changed to:', selectedFamily);
    const firstInFamily = Object.entries(OBSTACLE_TYPES).find(
      ([_, obs]) => obs.family === selectedFamily
    );
    if (firstInFamily) {
      const firstCode = firstInFamily[0] as ObstacleTypeCode;
      console.log('Setting first type in family:', firstCode);
      onSelectType(firstCode);
    } else {
      console.warn('No obstacle types found for family:', selectedFamily);
    }
  }, [selectedFamily, onSelectType]);

  // Get obstacles for the selected family
  const familyObstacles = Object.entries(OBSTACLE_TYPES)
    .filter(([_, obstacle]) => obstacle.family === selectedFamily)
    .map(([code, obstacle]) => ({
      code: code as ObstacleTypeCode,
      name: obstacle.name,
      description: obstacle.description,
      defaultRadius: obstacle.defaultRadius,
    }));

  const currentObstacle = OBSTACLE_TYPES[selectedType];

  return (
    <div className="space-y-4 p-4 bg-[#2e3b2e] rounded-lg border border-[#5a5a3e]">
      <h3 className="text-lg font-semibold text-[#e0e0c0]">Manual Placement</h3>
      
      <div>
        <label className="block text-sm font-medium text-[#b0a080] mb-2">
          Obstacle Category
        </label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(OBSTACLE_FAMILIES).map(([key, { name, icon }]) => (
            <button
              key={key}
              onClick={() => setSelectedFamily(key)}
              className={`px-3 py-2 rounded-lg transition flex items-center space-x-2 ${
                selectedFamily === key
                  ? 'bg-[#4b5320] text-[#e0e0c0]'
                  : 'bg-[#3f4f3f] text-[#b0a080] hover:bg-[#4b5320] hover:text-[#e0e0c0]'
              }`}
            >
              <span>{icon}</span>
              <span className="text-sm">{name}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-[#b0a080] mb-2">
          Obstacle Type
        </label>
        <select
          value={selectedType}
          onChange={(e) => {
            const newType = e.target.value as ObstacleTypeCode;
            console.log('Manual type selection:', newType);
            onSelectType(newType);
          }}
          className="w-full px-3 py-2 rounded-lg border border-[#5a5a3e] bg-[#2e3b2e] text-[#e0e0c0] focus:outline-none focus:border-[#8b7d6b]"
        >
          {familyObstacles.length === 0 && (
            <option value="" disabled>No obstacles in this category</option>
          )}
          {familyObstacles.map(({ code, name, description }) => (
            <option key={code} value={code}>
              {name} {description ? `– ${description}` : ''}
            </option>
          ))}
        </select>
      </div>
      
      {currentObstacle?.defaultRadius !== 0 && (
        <div>
          <div className="flex justify-between text-sm font-medium text-[#b0a080] mb-2">
            <span>Radius (meters)</span>
            <span className="text-[#e0e0c0]">{selectedRadius}m</span>
          </div>
          <input
            type="range"
            min="10"
            max="300"
            step="10"
            value={selectedRadius}
            onChange={(e) => onSelectRadius(parseInt(e.target.value))}
            className="w-full h-2 bg-[#5a5a3e] rounded-lg appearance-none cursor-pointer"
          />
        </div>
      )}
    </div>
  );
}