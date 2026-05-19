interface DoctrinalControlsProps {
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

export function DoctrinalControls({
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
}: DoctrinalControlsProps) {
  return (
    <div className="space-y-4 p-4 bg-[rgb(46,59,46)] rounded-lg border border-[rgb(90,90,62)]">
      <h3 className="text-lg font-semibold text-[rgb(224,224,192)]">Doctrinal Parameters</h3>

      {/* Target */}
      <div>
        <label className="block text-sm font-medium text-[rgb(176,160,128)] mb-2">
          Target (enemy force/formation)
        </label>
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-[rgb(90,90,62)] bg-[rgb(46,59,46)] text-[rgb(224,224,192)] focus:outline-none focus:border-[rgb(139,125,107)]"
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
        <label className="block text-sm font-medium text-[rgb(176,160,128)] mb-2">
          Desired Effect
        </label>
        <div className="grid grid-cols-2 gap-2">
          {['block', 'turn', 'fix', 'disrupt'].map((opt) => (
            <button
              key={opt}
              onClick={() => setEffect(opt)}
              className={`px-3 py-2 rounded-lg transition capitalize ${
                effect === opt
                  ? 'bg-[rgb(75,83,32)] text-[rgb(224,224,192)]'
                  : 'bg-[rgb(63,79,63)] text-[rgb(176,160,128)] hover:bg-[rgb(75,83,32)] hover:text-[rgb(224,224,192)]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Relative Location */}
      <div>
        <label className="block text-sm font-medium text-[rgb(176,160,128)] mb-2">
          Relative Location
        </label>
        <select
          value={relativeLocation}
          onChange={(e) => setRelativeLocation(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-[rgb(90,90,62)] bg-[rgb(46,59,46)] text-[rgb(224,224,192)] focus:outline-none focus:border-[hsl(34,13%,48%)]"
        >
          <option value="avenue of approach">Avenue of Approach</option>
          <option value="engagement area">Engagement Area</option>
          <option value="key terrain">Key Terrain</option>
          <option value="choke point">Choke Point</option>
          <option value="mobility corridor">Mobility Corridor</option>
          <option value="flank">Flank</option>
        </select>
      </div>

      {/* METT‑TC Section */}
      <div className="pt-4 border-t border-[rgb(90,90,62)]">
        <h4 className="text-md font-semibold text-[rgb(224,224,192)] mb-3">METT‑TC Factors</h4>

        <div className="mb-3">
          <label className="block text-sm font-medium text-[rgb(176,160,128)] mb-2">
            Mission
          </label>
          <select
            value={mission}
            onChange={(e) => setMission(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[rgb(90,90,62)] bg-[rgb(46,59,46)] text-[rgb(224,224,192)] focus:outline-none focus:border-[rgb(139,125,107)]"
          >
            <option value="defend">Defend</option>
            <option value="attack">Attack</option>
            <option value="delay">Delay</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-[rgb(176,160,128)] mb-2">
            Troops Available
          </label>
          <select
            value={troops}
            onChange={(e) => setTroops(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[rgb(90,90,62)] bg-[rgb(46,59,46)] text-[rgb(224,224,192)] focus:outline-none focus:border-[rgb(139,125,107)]"
          >
            <option value="platoon">Platoon</option>
            <option value="company">Company</option>
            <option value="battalion">Battalion</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-[rgb(176,160,128)] mb-2">
            Time Available
          </label>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[rgb(90,90,62)] bg-[rgb(46,59,46)] text-[rgb(224,224,192)] focus:outline-none focus:border-[rgb(139,125,107)]"
          >
            <option value="limited">Limited</option>
            <option value="ample">Ample</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-[rgb(176,160,128)] mb-2">
            Civil Considerations
          </label>
          <select
            value={civil}
            onChange={(e) => setCivil(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[rgb(90,90,62)] bg-[rgb(46,59,46)] text-[rgb(224,224,192)] focus:outline-none focus:border-[rgb(139,125,107)]"
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

