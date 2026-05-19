interface TerrainSectionProps {
  showTerrain: boolean;
  setShowTerrain: (active: boolean) => void;
  opacity?: number;
  setOpacity?: (opacity: number) => void;
}

export function TerrainSection({ showTerrain, setShowTerrain, opacity, setOpacity }: TerrainSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-md font-semibold text-[#e0e0c0] border-b border-[#5a5a3e] pb-1">Terrain</h3>
      <button
        onClick={() => setShowTerrain(!showTerrain)}
        className={`w-full px-3 py-2 rounded transition ${
          showTerrain
            ? 'bg-[#4b5320] text-[#e0e0c0]'
            : 'bg-[#2e3b2e] text-[#b0a080] hover:bg-[#4b5320] hover:text-[#e0e0c0]'
        }`}
      >
        {showTerrain ? 'Hide Overlay' : 'Show Overlay'}
      </button>
      {showTerrain && setOpacity && (
        <div>
          <label className="block text-sm text-[#b0a080] mb-1">Opacity</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}