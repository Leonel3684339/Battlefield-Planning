import type { UnitAffiliation, UnitEchelon, UnitModifiers } from '../types/units';
import { OBSTACLE_TYPES, type ObstacleTypeCode } from '../types/obstacles';
import milsymbol from 'milsymbol';

// ============================================================
//  UNIT SYMBOLS - MIL-STD-2525 COMPLIANT
// ============================================================

/**
 * Convert our affiliation to milsymbol's expected format
 * milsymbol uses: 'Friend' | 'Hostile' | 'Neutral' | 'Unknown' | 'Undefined'
 */
function toMilsymbolAffiliation(affiliation: UnitAffiliation): string {
  const mapping: Record<UnitAffiliation, string> = {
    friendly: 'Friend',
    hostile: 'Hostile',
    neutral: 'Neutral',
    unknown: 'Unknown',
  };
  return mapping[affiliation] || 'Unknown';
}

/**
 * Convert our echelon to milsymbol echelon code (character position 10)
 */
function toMilsymbolEchelon(echelon?: UnitEchelon): string {
  if (!echelon || echelon === 'none') return ''; // No echelon specified
  
  const mapping: Record<UnitEchelon, string> = {
    none: '',
    team: 'K',       // K = Team/Crew
    squad: 'A',      // A = Squad
    section: 'B',     // B = Section
    platoon: 'C',     // C = Platoon
    company: 'D',    // D = Company
    battalion: 'E',   // E = Battalion
    regiment: 'F',    // F = Regiment
    brigade: 'G',     // G = Brigade
    division: 'H',    // H = Division
    corps: 'I',      // I = Corps
    army: 'J',      // J = Army
  };
  return mapping[echelon] || '';
}

/**
 * Convert unit code to valid 10-character SIDC code
 * Format in milsymbol: AAAAA-BBBB-CCCDD (12 chars total)
 * Position 1: S = Scheme (Ground)
 * Position 2: F = Dimension (Ground)
 * Position 3: A = Status (Present)
 * Position 4-5: --
 * Position 6-9: Function ID (4 chars)
 * Position 10: Echelon
 */
function toMilsymbolCode(unitCode: string, echelon?: UnitEchelon): string {
  // Map unit type codes to 4-char function IDs for ground units
  const functionIds: Record<string, string> = {
    I: 'GINF',     // Infantry
    M: 'ARM',     // Armor/Armored
    A: 'ART',     // Artillery
    E: 'ENG',     // Engineer
    C: 'REC',     // Recon/Cavalry
    AV: 'AVC',    // Aviation
    ADA: 'ADA',    // Air Defense
    MI: 'INT',     // Intelligence
    SIG: 'SIG',    // Signal
    CM: 'CBR',    // Chemical/Biological
    MP: 'MP',     // Military Police
    TC: 'TRK',    // Transportation
    QM: 'QMR',    // Quartermaster
    ORD: 'ORD',    // Ordnance
  };

  const funcId = functionIds[unitCode] || 'GEN'; // Generic unit
  const echelonChar = toMilsymbolEchelon(echelon);
  
  // Build a valid 10-character SIDC code
  // SF (Ground present) + function (4 chars) + echelon + --
  let sidc = 'SF' + funcId + (echelonChar || '-') + '--';
  
  // Pad to 10 chars
  while (sidc.length < 10) sidc += '-';
  return sidc.substring(0, 10);
}

/**
 * Create a unit symbol SVG using milsymbol library (MIL-STD-2525 compliant)
 */
export function createUnitSymbol(
  unitCode: string,
  affiliation: UnitAffiliation,
  echelon?: UnitEchelon,
  modifiers?: UnitModifiers
): string | null {
  try {
    const symbolId = toMilsymbolCode(unitCode, echelon);
    const affil = toMilsymbolAffiliation(affiliation);
    
    // Create milsymbol with valid options
    const symbol = new milsymbol.Symbol(symbolId, {
      standard: 'APP6B',
      affiliation: affil as any,
      headquartersElement: modifiers?.headquarters ? 'Yes' : undefined,
    } as any);

    // Get SVG output
    const svg = symbol.asSVG();
    return svg;
  } catch (error) {
    console.error('Error creating milsymbol:', error);
    return createFallbackSymbol(unitCode, affiliation);
  }
}

/**
 * Create fallback symbol when milsymbol fails
 */
function createFallbackSymbol(unitCode: string, affiliation: UnitAffiliation): string {
  const colors: Record<UnitAffiliation, string> = {
    friendly: '#80E0FF',
    hostile: '#FF8080',
    neutral: '#80FF80',
    unknown: '#C0C0C0',
  };
  
  const fill = colors[affiliation] || colors.unknown;
  
  return `<svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="10" width="40" height="30" fill="${fill}" stroke="black" stroke-width="2"/>
    <text x="25" y="30" font-size="14" fill="black" text-anchor="middle">${unitCode}</text>
  </svg>`;
}

// ============================================================
//  OBSTACLE SYMBOLS - MIL-STD-2525 COMPLIANT
// ============================================================

/**
 * Map obstacle type codes to MIL-STD-2525 symbol IDs
 */
const obstacleSymbolMap: Record<ObstacleTypeCode, string> = {
  // Wire obstacles
  'OBWL': 'G*GLL*WIL----------',  // Low wire
  'OBWH': 'G*GLL*WIH----------',  // High wire  
  'OBW': 'G*GLL*WI------------',  // Wire
  'OBWC': 'G*GLL*WC------------',  // Concertina
  'OBWD': 'G*GLL*WD------------',  // Double apron
  'OBWT': 'G*GLL*WT------------',  // Triple concertina
  
  // Minefields
  'OMP': 'G*GMF---------------', // Minefield
  'OMPA': 'G*GMF*AP-----------', // Antitank mine
  'OMPD': 'G*GMF*APD----------',  // Direct fire
  'OMPF': 'G*GMF*APF----------', // Fuse
  'OMPB': 'G*GMF*APB----------', // Blast
  'OMT': 'G*GMF*AT-----------', // Antitank (to be)
  'OMTA': 'G*GMF*AT*AP-------', // Antitank to be
  'OMTD': 'G*GMF*AT*D--------', // Antitank directional
  'OMTS': 'G*GMF*AT*SCAT-----', // Scatterable
  'OMD': 'G*GMF*AD-----------', // AT (dragged)
  'OME': 'G*GMF*EW-----------', // Wide area
  'OMW': 'G*GMF*WW-----------', // Wide area
  'OMU': 'G*GMF*US-----------', // Unspecified
  
  // Other obstacles
  'OBB': 'G*GBS----------------', // Barrier
  'OBBR': 'G*GBS*R------------', // Reinforced
  'OBBW': 'G*GBS*W------------', // Wooden
  'OBBV': 'G*GBS*V------------', // Vehicle
  'OBBH': 'G*GBS*H------------', // Hebco
  'OBBD': 'G*GBS*D------------', // Demo
  'OBBB': 'G*GBS*B------------', // Bunker
  'OBBT': 'G*GBS*DT-----------', // Tank ditch
  'OBBC': 'G*GBS*CR-----------', // Crater
  'OBER': 'G*GBS*ER-----------', // Enhanced radar
  'OBEW': 'G*GBS*EW-----------', // Engineered weapon
  'OBEF': 'G*GBS*EF-----------', // Enhanced friction
  'OBE': 'G*GMF---------------', // Existing minefield
  'OBES': 'G*GMF*S------------', // Existing sector
  'OBT': 'G*GBS*T------------', // Tunnel
  'OBD': 'G*GBS*D------------', // Defile
  'OBBLK': 'G*GBS*L------------', // Block
  'OBF': 'G*GBS*F------------', // Ford
  'OBCNL': 'G*GBS*CNL----------', // Canal
};

export function createObstacleSymbol(typeCode: ObstacleTypeCode): string | null {
  const obstacle = OBSTACLE_TYPES[typeCode];
  if (!obstacle) return null;

  try {
    // Try to get MIL-STD-2525 symbol
    const symbolId = obstacleSymbolMap[typeCode];
    
    if (symbolId) {
      const symbol = new milsymbol.Symbol(symbolId, {
        condition: 'Present',
      } as any);
      return symbol.asSVG();
    }
    
    // Fallback: create simple obstacle symbol
    return createSimpleObstacleSymbol(typeCode);
  } catch (error) {
    console.error('Error creating obstacle symbol:', error);
    return createSimpleObstacleSymbol(typeCode);
  }
}

/**
 * Create simple obstacle symbol as fallback
 */
function createSimpleObstacleSymbol(typeCode: ObstacleTypeCode): string {
  return `<svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
    <circle cx="25" cy="25" r="20" fill="#E0E0C0" stroke="black" stroke-width="2"/>
    <text x="25" y="30" font-size="10" fill="black" text-anchor="middle">${typeCode}</text>
  </svg>`;
}

// ============================================================
//  FALLBACK
// ============================================================

export function fallbackSVG(text: string): string {
  const display = text.length > 8 ? text.slice(0, 6) + '…' : text;
  return `<svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
    <circle cx="25" cy="25" r="22" fill="#2E3B2E" stroke="#E0E0C0" stroke-width="2"/>
    <text x="25" y="30" font-size="10" fill="white" text-anchor="middle">${display}</text>
  </svg>`;
}


 