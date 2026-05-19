export type UnitAffiliation = 'friendly' | 'hostile' | 'neutral' | 'unknown';

export type UnitEchelon =
  | 'none'
  | 'team'
  | 'squad'
  | 'section'
  | 'platoon'
  | 'company'
  | 'battalion'
  | 'regiment'
  | 'brigade'
  | 'division'
  | 'corps'
  | 'army';

// MIL-STD-2525 echelon codes
export const ECHELON_CODES: Record<UnitEchelon, string> = {
  none: '',
  team: 'A',      // Actually 'A' is squad, but we'll use common mapping
  squad: 'A',
  section: 'B',
  platoon: 'C',
  company: 'D',
  battalion: 'E',
  regiment: 'F',
  brigade: 'G',
  division: 'H',
  corps: 'I',
  army: 'J',
};

export interface UnitModifiers {
  headquarters: boolean;
  taskForce: boolean;
  // Add feint, etc. later if needed
}

export interface UnitType {
  code: string;
  name: string;
  category: string;
  description?: string;
}

export const UNIT_TYPES: Record<string, UnitType> = {
  I: { code: 'I', name: 'Infantry', category: 'infantry', description: 'Basic infantry unit' },
  M: { code: 'M', name: 'Armor', category: 'armor', description: 'Armored unit (tanks)' },
  A: { code: 'A', name: 'Artillery', category: 'artillery', description: 'Field artillery' },
  E: { code: 'E', name: 'Engineer', category: 'engineer', description: 'Combat engineers' },
  C: { code: 'C', name: 'Cavalry', category: 'cavalry', description: 'Reconnaissance/cavalry' },
  AV: { code: 'AV', name: 'Aviation', category: 'aviation', description: 'Army aviation' },
  ADA: { code: 'ADA', name: 'Air Defense', category: 'airdefense', description: 'Air defense artillery' },
  MI: { code: 'MI', name: 'Military Intelligence', category: 'intelligence', description: 'Military intelligence' },
  SIG: { code: 'SIG', name: 'Signal', category: 'signal', description: 'Signal corps' },
  CM: { code: 'CM', name: 'Chemical', category: 'chemical', description: 'Chemical, biological, radiological' },
  MP: { code: 'MP', name: 'Military Police', category: 'police', description: 'Military police' },
  TC: { code: 'TC', name: 'Transportation', category: 'transport', description: 'Transportation corps' },
  QM: { code: 'QM', name: 'Quartermaster', category: 'supply', description: 'Supply and logistics' },
  ORD: { code: 'ORD', name: 'Ordnance', category: 'ordnance', description: 'Ordnance maintenance' },
};

export type UnitTypeCode = keyof typeof UNIT_TYPES;

export interface UnitMarker {
  id: string;
  lat: number;
  lng: number;
  typeCode: UnitTypeCode;
  affiliation: UnitAffiliation;
  name?: string;
  echelon?: UnitEchelon;          // new
  modifiers?: UnitModifiers;       // new
}