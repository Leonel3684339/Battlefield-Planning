import { UNIT_TYPES, type UnitTypeCode, type UnitAffiliation, type UnitEchelon, type UnitModifiers } from '../types/units';

interface UnitSelectorProps {
  selectedType: UnitTypeCode;
  onSelectType: (type: UnitTypeCode) => void;
  selectedAffiliation: UnitAffiliation;
  onSelectAffiliation: (affiliation: UnitAffiliation) => void;
  selectedEchelon: UnitEchelon;
  onSelectEchelon: (echelon: UnitEchelon) => void;
  selectedModifiers: UnitModifiers;
  onSelectModifiers: (modifiers: UnitModifiers) => void;
}

export function UnitSelector({
  selectedType,
  onSelectType,
  selectedAffiliation,
  onSelectAffiliation,
  selectedEchelon,
  onSelectEchelon,
  selectedModifiers = { headquarters: false, taskForce: false },
  onSelectModifiers,
}: UnitSelectorProps) {
  const safeModifiers = {
    headquarters: selectedModifiers?.headquarters ?? false,
    taskForce: selectedModifiers?.taskForce ?? false,
  };

  return (
    <div className="space-y-4 p-4 bg-[#2e3b2e] rounded-lg border border-[#5a5a3e] min-w-[300px]">
      <h3 className="text-lg font-semibold text-[#e0e0c0]">Place Unit</h3>

      {/* Affiliation selector */}
      <div>
        <label className="block text-sm font-medium text-[#b0a080] mb-2">Affiliation</label>
        <div className="flex space-x-2">
          {(['friendly', 'hostile', 'neutral', 'unknown'] as UnitAffiliation[]).map(aff => (
            <button
              key={aff}
              onClick={() => onSelectAffiliation(aff)}
              className={`px-3 py-2 rounded-lg transition flex-1 ${
                selectedAffiliation === aff
                  ? 'bg-[#4b5320] text-[#e0e0c0]'
                  : 'bg-[#3f4f3f] text-[#b0a080] hover:bg-[#4b5320] hover:text-[#e0e0c0]'
              }`}
            >
              {aff.charAt(0).toUpperCase() + aff.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Unit type selector */}
      <div>
        <label className="block text-sm font-medium text-[#b0a080] mb-2">Unit Type</label>
        <select
          value={selectedType}
          onChange={(e) => {
            console.log('🔽 UnitSelector onChange:', e.target.value);
            onSelectType(e.target.value as UnitTypeCode);
          }}
          className="w-full px-3 py-2 rounded-lg border border-[#5a5a3e] bg-[#2e3b2e] text-[#e0e0c0] focus:outline-none focus:border-[#8b7d6b]"
        >
          {Object.entries(UNIT_TYPES).map(([code, { name, description }]) => (
            <option key={code} value={code}>
              {name} {description ? `– ${description}` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Echelon selector */}
      <div>
        <label className="block text-sm font-medium text-[#b0a080] mb-2">Unit Size (Echelon)</label>
        <select
          value={selectedEchelon}
          onChange={(e) => onSelectEchelon(e.target.value as UnitEchelon)}
          className="w-full px-3 py-2 rounded-lg border border-[#5a5a3e] bg-[#2e3b2e] text-[#e0e0c0] focus:outline-none focus:border-[#8b7d6b]"
        >
          <option value="none">None</option>
          <option value="team">Team</option>
          <option value="squad">Squad</option>
          <option value="section">Section</option>
          <option value="platoon">Platoon</option>
          <option value="company">Company</option>
          <option value="battalion">Battalion</option>
          <option value="regiment">Regiment</option>
          <option value="brigade">Brigade</option>
          <option value="division">Division</option>
          <option value="corps">Corps</option>
          <option value="army">Army</option>
        </select>
      </div>

      {/* Modifiers checkboxes */}
      <div>
        <label className="block text-sm font-medium text-[#b0a080] mb-2">Modifiers</label>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={safeModifiers.headquarters}
              onChange={(e) =>
                onSelectModifiers({
                  ...safeModifiers,
                  headquarters: e.target.checked,
                })
              }
              className="form-checkbox h-4 w-4 text-[#4b5320] rounded border-[#5a5a3e] bg-[#2e3b2e]"
            />
            <span className="text-sm text-[#b0a080]">Headquarters</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={safeModifiers.taskForce}
              onChange={(e) =>
                onSelectModifiers({
                  ...safeModifiers,
                  taskForce: e.target.checked,
                })
              }
              className="form-checkbox h-4 w-4 text-[#4b5320] rounded border-[#5a5a3e] bg-[#2e3b2e]"
            />
            <span className="text-sm text-[#b0a080]">Task Force</span>
          </label>
        </div>
      </div>
    </div>
  );
}
