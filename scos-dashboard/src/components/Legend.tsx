import { OBSTACLE_FAMILIES } from '../types/obstacles';

const familyColors = {
  wire: '#d4a017',      // golden yellow
  minefield: '#b22222',  // firebrick red
  barrier: '#2e5a8c',    // steel blue
  existing: '#2e7d32',   // forest green
  effect: '#6a1b9a',     // purple
};

export function Legend() {
  return (
    <div className="absolute bottom-5 right-5 bg-[#2e3b2e] border border-[#5a5a3e] rounded-lg p-3 shadow-lg z-[1000]">
      <h4 className="text-sm font-semibold text-[#e0e0c0] mb-2">Obstacle Types</h4>
      <div className="space-y-1">
        {Object.entries(OBSTACLE_FAMILIES).map(([key, { name }]) => (
          <div key={key} className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: familyColors[key as keyof typeof familyColors] }}
            />
            <span className="text-xs text-[#b0a080]">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}