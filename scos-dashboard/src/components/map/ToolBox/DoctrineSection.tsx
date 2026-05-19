interface DoctrineSectionProps {
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
}

export function DoctrineSection({
  target,
  setTarget,
  effect,
  setEffect,
  relativeLocation,
  setRelativeLocation,
  mission,
  setMission,
  troops,
  setTroops,
  time,
  setTime,
  civil,
  setCivil,
}: DoctrineSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-md font-semibold text-[#e0e0c0] border-b border-[#5a5a3e] pb-1">Doctrine</h3>

      {/* Target */}
      <div>
        <label className="block text-sm font-medium text-[#b0a080] mb-1">Target</label>
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="w-full px-2 py-1 rounded border border-[#5a5a3e] bg-[#2e3b2e] text-[#e0e0c0] text-sm"
        >
          <option value="mechanized infantry">Mechanized Infantry</option>
          <option value="armor">Armor</option>
          <option value="dismounted infantry">Dismounted Infantry</option>
          <option value="reconnaissance">Reconnaissance</option>
          <option value="logistics">Logistics</option>
        </select>
      </div>

      {/* Effect */}
      <div>
        <label className="block text-sm font-medium text-[#b0a080] mb-1">Effect</label>
        <div className="grid grid-cols-2 gap-1">
          {['block', 'turn', 'fix', 'disrupt'].map((opt) => (
            <button
              key={opt}
              onClick={() => setEffect(opt)}
              className={`px-2 py-1 rounded text-sm capitalize ${
                effect === opt
                  ? 'bg-[#4b5320] text-[#e0e0c0]'
                  : 'bg-[#2e3b2e] text-[#b0a080] hover:bg-[#4b5320]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Relative Location */}
      <div>
        <label className="block text-sm font-medium text-[#b0a080] mb-1">Location</label>
        <select
          value={relativeLocation}
          onChange={(e) => setRelativeLocation(e.target.value)}
          className="w-full px-2 py-1 rounded border border-[#5a5a3e] bg-[#2e3b2e] text-[#e0e0c0] text-sm"
        >
          <option value="avenue of approach">Avenue of Approach</option>
          <option value="engagement area">Engagement Area</option>
          <option value="key terrain">Key Terrain</option>
          <option value="choke point">Choke Point</option>
          <option value="mobility corridor">Mobility Corridor</option>
          <option value="flank">Flank</option>
        </select>
      </div>

      {/* METT‑TC (compact) */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-[#b0a080]">Mission</label>
          <select
            value={mission}
            onChange={(e) => setMission(e.target.value)}
            className="w-full px-2 py-1 rounded border border-[#5a5a3e] bg-[#2e3b2e] text-[#e0e0c0] text-xs"
          >
            <option value="defend">Defend</option>
            <option value="attack">Attack</option>
            <option value="delay">Delay</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-[#b0a080]">Troops</label>
          <select
            value={troops}
            onChange={(e) => setTroops(e.target.value)}
            className="w-full px-2 py-1 rounded border border-[#5a5a3e] bg-[#2e3b2e] text-[#e0e0c0] text-xs"
          >
            <option value="platoon">Platoon</option>
            <option value="company">Company</option>
            <option value="battalion">Battalion</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-[#b0a080]">Time</label>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-2 py-1 rounded border border-[#5a5a3e] bg-[#2e3b2e] text-[#e0e0c0] text-xs"
          >
            <option value="limited">Limited</option>
            <option value="ample">Ample</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-[#b0a080]">Civil</label>
          <select
            value={civil}
            onChange={(e) => setCivil(e.target.value)}
            className="w-full px-2 py-1 rounded border border-[#5a5a3e] bg-[#2e3b2e] text-[#e0e0c0] text-xs"
          >
            <option value="none">None</option>
            <option value="light">Light</option>
            <option value="heavy">Heavy</option>
          </select>
        </div>
      </div>
    </div>
  );
}