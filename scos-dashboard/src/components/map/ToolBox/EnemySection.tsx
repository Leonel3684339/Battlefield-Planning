interface EnemySectionProps {
  enemyPosition: [number, number] | null;
  setEnemyPosition: (pos: [number, number] | null) => void;
  enemyDirection: number;
  setEnemyDirection: (dir: number) => void;
  enemySpeed: number;
  setEnemySpeed: (speed: number) => void;
  placementMode: boolean;
  setPlacementMode: (mode: boolean) => void;
  // Movement props
  isMoving: boolean;
  setIsMoving: (moving: boolean) => void;
  movementProgress: number;
  setMovementProgress: (progress: number) => void;
  onPlayPause: () => void;
  onStop: () => void;
  onReset: () => void;
}

export function EnemySection({
  enemyPosition,
  enemyDirection,
  setEnemyDirection,
  enemySpeed,
  setEnemySpeed,
  placementMode,
  setPlacementMode,
  isMoving,
  movementProgress,
  onPlayPause,
  onStop,
  onReset,
}: EnemySectionProps) {
  const handleToggle = () => {
    if (typeof setPlacementMode === 'function') {
      setPlacementMode(!placementMode);
    } else {
      console.error('setPlacementMode is not a function');
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-md font-semibold text-[#e0e0c0] border-b border-[#5a5a3e] pb-1">Enemy Forces</h3>
      
      {/* Placement button */}
      <button
        onClick={handleToggle}
        className={`w-full px-3 py-2 rounded transition ${
          placementMode
            ? 'bg-[#4b5320] text-[#e0e0c0]'
            : 'bg-[#2e3b2e] text-[#b0a080] hover:bg-[#4b5320] hover:text-[#e0e0c0]'
        }`}
      >
        {placementMode ? 'Click map to place enemy' : 'Place Enemy'}
      </button>

      {/* Enemy controls - only show if enemy placed */}
      {enemyPosition && (
        <>
          {/* Direction and speed sliders */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-[#b0a080]">Direction</span>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              value={enemyDirection}
              onChange={(e) => setEnemyDirection(Number(e.target.value))}
              className="flex-1"
              disabled={isMoving}
            />
            <span className="text-sm text-[#e0e0c0]">{enemyDirection}°</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-[#b0a080]">Speed</span>
            <input
              type="range"
              min="0"
              max="80"
              step="5"
              value={enemySpeed}
              onChange={(e) => setEnemySpeed(Number(e.target.value))}
              className="flex-1"
              disabled={isMoving}
            />
            <span className="text-sm text-[#e0e0c0]">{enemySpeed} km/h</span>
          </div>

          {/* Movement controls */}
          <div className="pt-2 border-t border-[#5a5a3e]">
            <div className="flex space-x-2 mb-2">
              <button
                onClick={onPlayPause}
                disabled={!enemyPosition}
                className={`flex-1 px-3 py-2 rounded transition ${
                  isMoving
                    ? 'bg-[#4b5320] text-[#e0e0c0]'
                    : 'bg-[#2e3b2e] text-[#b0a080] hover:bg-[#4b5320] hover:text-[#e0e0c0]'
                }`}
              >
                {isMoving ? 'Pause' : 'Play'}
              </button>
              <button
                onClick={onStop}
                disabled={!enemyPosition}
                className="flex-1 px-3 py-2 bg-[#2e3b2e] text-[#b0a080] hover:bg-[#4b5320] hover:text-[#e0e0c0] rounded transition"
              >
                Stop
              </button>
              <button
                onClick={onReset}
                disabled={!enemyPosition}
                className="flex-1 px-3 py-2 bg-[#2e3b2e] text-[#b0a080] hover:bg-[#4b5320] hover:text-[#e0e0c0] rounded transition"
              >
                Reset
              </button>
            </div>

            {/* Progress bar */}
            {isMoving && (
              <div className="w-full bg-[#2e3b2e] rounded-full h-2">
                <div
                  className="bg-[#4b5320] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${movementProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
