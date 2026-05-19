interface StatusBarProps {
  scale?: number;
  cursorLatLng?: { lat: number; lng: number };
  obstacleCount?: number;
  unitCount?: number;
  message?: string;
}

export function StatusBar({ scale, cursorLatLng, obstacleCount, unitCount, message }: StatusBarProps) {
  return (
    <div className="bg-[#2e3b2e] border-t border-[#5a5a3e] text-[#b0a080] text-xs px-4 py-1 flex justify-between items-center">
      <div className="flex space-x-4">
        {scale && <span>Scale: 1:{Math.round(scale)}</span>}
        {cursorLatLng && <span>Cursor: {cursorLatLng.lat.toFixed(5)}, {cursorLatLng.lng.toFixed(5)}</span>}
        {obstacleCount !== undefined && <span>Obstacles: {obstacleCount}</span>}
        {unitCount !== undefined && <span>Units: {unitCount}</span>}
      </div>
      {message && <div className="text-[#8b7d6b]">{message}</div>}
    </div>
  );
}