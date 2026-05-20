import type { UnitAffiliation, UnitEchelon, UnitModifiers } from '../types/units';
import { OBSTACLE_TYPES, type ObstacleTypeCode } from '../types/obstacles';

// ============================================================
//  UNIT SYMBOLS - Simple reliable SVG (MIL-STD-2525 style)
// ============================================================

/**
 * Create a unit symbol SVG with proper frame and icon
 * - Friendly: Blue rectangle frame
 * - Hostile: Red diamond frame
 * - Neutral: Green square frame
 * - Unknown: Gray square frame
 */
export function createUnitSymbol(
  unitCode: string,
  affiliation: UnitAffiliation,
  echelon?: UnitEchelon,
  _modifiers?: UnitModifiers
): string | null {
  return createSimpleUnitSVG(unitCode, affiliation, echelon);
}

function createSimpleUnitSVG(
  unitCode: string,
  affiliation: UnitAffiliation,
  echelon?: UnitEchelon
): string {
  // Affiliation colors per MIL-STD-2525
  const colors: Record<UnitAffiliation, { fill: string; frame: string }> = {
    friendly: { fill: 'rgb(128,224,255)', frame: 'rgb(0,0,0)' },    // Light blue
    hostile:  { fill: 'rgb(255,128,128)', frame: 'rgb(0,0,0)' },    // Light red
    neutral:  { fill: 'rgb(128,255,128)', frame: 'rgb(0,0,0)' },   // Light green
    unknown:  { fill: 'rgb(192,192,192)', frame: 'rgb(0,0,0)' },   // Gray
  };
  
  const c = colors[affiliation] || colors.unknown;
  
  // Simple icon based on unit type
  let iconPath = '';
  switch (unitCode) {
    case 'I': // Infantry - X marks
      iconPath = '<line x1="35" y1="35" x2="65" y2="65" stroke="black" stroke-width="4"/><line x1="65" y1="35" x2="35" y2="65" stroke="black" stroke-width="4"/>';
      break;
    case 'M': // Armor - tank track rectangle
      iconPath = '<rect x="30" y="35" width="40" height="25" rx="5" fill="none" stroke="black" stroke-width="3"/>';
      break;
    case 'A': // Artillery - circle
      iconPath = '<circle cx="50" cy="50" r="15" fill="none" stroke="black" stroke-width="3"/>';
      break;
    case 'E': // Engineer - crossed lines with box
      iconPath = '<line x1="30" y1="35" x2="70" y2="65" stroke="black" stroke-width="3"/><line x1="70" y1="35" x2="30" y2="65" stroke="black" stroke-width="3"/><rect x="35" y="45" width="30" height="15" fill="none" stroke="black" stroke-width="2"/>';
      break;
    case 'C': // Cavalry - dashed line
      iconPath = '<line x1="25" y1="50" x2="75" y2="50" stroke="black" stroke-width="4" stroke-dasharray="8,4"/>';
      break;
    case 'AV': // Aviation - Y shape
      iconPath = '<line x1="50" y1="65" x2="50" y2="35" stroke="black" stroke-width="3"/><line x1="50" y1="50" x2="25" y2="30" stroke="black" stroke-width="3"/><line x1="50" y1="50" x2="75" y2="30" stroke="black" stroke-width="3"/>';
      break;
    case 'ADA': // Air Defense - inverted V with circle
      iconPath = '<line x1="35" y1="35" x2="50" y2="65" stroke="black" stroke-width="3"/><line x1="65" y1="35" x2="50" y2="65" stroke="black" stroke-width="3"/><circle cx="50" cy="40" r="5" fill="none" stroke="black" stroke-width="2"/>';
      break;
    default:
      iconPath = '<text x="50" y="55" font-size="20" text-anchor="middle" fill="black">?</text>';
  }
  
  // Frame shape based on affiliation
  let frameShape = '';
  if (affiliation === 'hostile') {
    // Diamond for hostile
    frameShape = `<path d="M50,10 L90,50 L50,90 L10,50 Z" fill="${c.fill}" stroke="${c.frame}" stroke-width="3"/>`;
  } else if (affiliation === 'neutral') {
    // Square for neutral
    frameShape = `<rect x="15" y="15" width="70" height="70" fill="${c.fill}" stroke="${c.frame}" stroke-width="3"/>`;
  } else {
    // Rectangle for friendly
    frameShape = `<rect x="20" y="20" width="60" height="60" fill="${c.fill}" stroke="${c.frame}" stroke-width="3"/>`;
  }
  
  // Add echelon indicator above frame
  let echelonIndicator = '';
  if (echelon && echelon !== 'none') {
    const dots: Record<string, number> = { squad: 1, section: 2, platoon: 3 };
    const barCounts: Record<string, number> = { company: 1, battalion: 2, regiment: 3 };
    const echelonStr = String(echelon);
    if (dots[echelonStr]) {
      for (let i = 0; i < dots[echelonStr]; i++) {
        echelonIndicator += `<circle cx="${40 + (i * 10)}" cy="8" r="3" fill="black"/>`;
      }
    } else if (barCounts[echelonStr]) {
      for (let i = 0; i < barCounts[echelonStr]; i++) {
        echelonIndicator += `<rect x="${35 + (i * 10)}" y="3" width="6" height="8" fill="black"/>`;
      }
    }
  }
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 100 100">
    ${frameShape}
    <g>${iconPath}</g>
    ${echelonIndicator}
  </svg>`;
}

// ============================================================
//  OBSTACLE SYMBOLS - Simple reliable SVG
// ============================================================

/**
 * Create obstacle symbol with proper patterns
 */
export function createObstacleSymbol(typeCode: ObstacleTypeCode): string | null {
  const obstacle = OBSTACLE_TYPES[typeCode];
  if (!obstacle) return null;
  
  return createSimpleObstacleSVG(typeCode);
}

function createSimpleObstacleSVG(typeCode: ObstacleTypeCode): string {
  // Pattern based on MIL-STD-2525 tactical graphics for obstacles
  let pattern = '';
  const color = '#C0B080'; // Tan/khaki color for obstacles
  
  // ============================================================
  // WIRE OBSTACLES - Lines/ wire obstacles
  // ============================================================
  if (typeCode === 'OBWL' || typeCode === 'OBW') {
    // LOW WIRE - Single line with posts (front view)
    // MIL-STD-2525: G*GLL*WI (Low Wire)
    pattern = `<line x1="8" y1="25" x2="42" y2="25" stroke="black" stroke-width="2"/>
    <line x1="12" y1="25" x2="12" y2="35" stroke="black" stroke-width="2"/>
    <line x1="25" y1="25" x2="25" y2="35" stroke="black" stroke-width="2"/>
    <line x1="38" y1="25" x2="38" y2="35" stroke="black" stroke-width="2"/>`;
  } else if (typeCode === 'OBWH') {
    // HIGH WIRE - Wire at top with posts
    pattern = `<line x1="8" y1="18" x2="42" y2="18" stroke="black" stroke-width="2"/>
    <line x1="8" y1="18" x2="8" y2="38" stroke="black" stroke-width="2"/>
    <line x1="25" y1="18" x2="25" y2="38" stroke="black" stroke-width="2"/>
    <line x1="42" y1="18" x2="42" y2="38" stroke="black" stroke-width="2"/>
    <line x1="8" y1="18" x2="42" y2="18" stroke="black" stroke-width="1.5" stroke-dasharray="4,3"/>`;
  } else if (typeCode === 'OBWC') {
    // CONCERTINA - Spiral coil pattern (top view)
    pattern = `<ellipse cx="25" cy="25" rx="12" ry="6" fill="none" stroke="black" stroke-width="2"/>
    <ellipse cx="25" cy="25" rx="7" ry="3.5" fill="none" stroke="black" stroke-width="1.5"/>
    <circle cx="16" cy="25" r="2.5" fill="black"/>
    <circle cx="34" cy="25" r="2.5" fill="black"/>`;
  } else if (typeCode === 'OBWD') {
    // DOUBLE APRON - Two horizontal lines with diagonal cross braces
    pattern = `<line x1="8" y1="18" x2="42" y2="18" stroke="black" stroke-width="2"/>
    <line x1="8" y1="32" x2="42" y2="32" stroke="black" stroke-width="2"/>
    <line x1="12" y1="18" x2="12" y2="32" stroke="black" stroke-width="1.5"/>
    <line x1="25" y1="18" x2="25" y2="32" stroke="black" stroke-width="1.5"/>
    <line x1="38" y1="18" x2="38" y2="32" stroke="black" stroke-width="1.5"/>`;
  } else if (typeCode === 'OBWT') {
    // TRIPLE CONCERTINA - Three coils stacked
    pattern = `<ellipse cx="20" cy="20" rx="10" ry="5" fill="none" stroke="black" stroke-width="1.5"/>
    <ellipse cx="30" cy="20" rx="10" ry="5" fill="none" stroke="black" stroke-width="1.5"/>
    <ellipse cx="25" cy="30" rx="12" ry="6" fill="none" stroke="black" stroke-width="1.5"/>
    <line x1="10" y1="16" x2="40" y2="38" stroke="black" stroke-width="1" stroke-dasharray="2,2"/>`;
    
  // ============================================================
  // MINEFIELDS - Tactical graphic area with internal details
  // ============================================================
  } else if (typeCode === 'OMP' || typeCode === 'OMPA') {
    // ANTITANK MINEFIELD - Rectangular boundary with AT mine symbols inside
    // MIL-STD-2525: G*GMF*AT (AT Minefield)
    // Shows rectangular boundary, antitank mines (rectangular with diagonal), density pattern
    pattern = `<rect x="10" y="15" width="30" height="20" fill="none" stroke="black" stroke-width="2"/>
    <rect x="14" y="19" width="6" height="4" fill="black"/>
    <rect x="24" y="19" width="6" height="4" fill="black"/>
    <rect x="34" y="19" width="6" height="4" fill="black"/>
    <rect x="14" y="28" width="6" height="4" fill="black"/>
    <rect x="24" y="28" width="6" height="4" fill="black"/>
    <rect x="34" y="28" width="6" height="4" fill="black"/>
    <line x1="10" y1="15" x2="10" y2="12" stroke="black" stroke-width="1.5"/>
    <line x1="40" y1="15" x2="40" y2="12" stroke="black" stroke-width="1.5"/>`;
  } else if (typeCode === 'OMP' || typeCode === 'OMPB') {
    // ANTIPERSONNEL MINEFIELD - Smaller scattered mines
    pattern = `<rect x="10" y="15" width="30" height="20" fill="none" stroke="black" stroke-width="2"/>
    <circle cx="15" cy="22" r="2" fill="black"/>
    <circle cx="23" cy="20" r="2" fill="black"/>
    <circle cx="31" cy="22" r="2" fill="black"/>
    <circle cx="19" cy="28" r="2" fill="black"/>
    <circle cx="27" cy="30" r="2" fill="black"/>
    <circle cx="35" cy="28" r="2" fill="black"/>`;
  } else if (typeCode === 'OMS' || typeCode === 'OMTS') {
    // SCATTERABLE MINEFIELD - Row pattern with launch indicators
    pattern = `<rect x="8" y="15" width="34" height="12" fill="none" stroke="black" stroke-width="2"/>
    <circle cx="14" cy="21" r="2.5" fill="black"/>
    <circle cx="25" cy="21" r="2.5" fill="black"/>
    <circle cx="36" cy="21" r="2.5" fill="black"/>
    <path d="M10,35 L10,42 M25,35 L25,42 M40,35 L40,42" stroke="black" stroke-width="1.5"/>`;
  } else if (typeCode === 'OMD') {
    // ANTITANK DITCH/AXIS OF ADVANCE - V-shaped ditch with hatching
    pattern = `<path d="M8,42 L15,18 L35,18 L42,42" fill="none" stroke="black" stroke-width="2.5"/>
    <line x1="16" y1="32" x2="16" y2="38" stroke="black" stroke-width="1"/>
    <line x1="21" y1="32" x2="21" y2="38" stroke="black" stroke-width="1"/>
    <line x1="26" y1="32" x2="26" y2="38" stroke="black" stroke-width="1"/>
    <line x1="31" y1="32" x2="31" y2="38" stroke="black" stroke-width="1"/>
    <line x1="14" y1="30" x2="18" y2="22" stroke="black" stroke-width="1"/>
    <line x1="26" y1="30" x2="22" y2="22" stroke="black" stroke-width="1"/>
    <line x1="38" y1="30" x2="34" y2="22" stroke="black" stroke-width="1"/>`;
  } else if (typeCode.startsWith('OM')) {
    // GENERIC MINEFIELD - Default rectangular mine pattern
    pattern = `<rect x="10" y="12" width="30" height="26" fill="none" stroke="black" stroke-width="2"/>
    <rect x="14" y="16" width="5" height="3" fill="black"/>
    <rect x="28" y="16" width="5" height="3" fill="black"/>
    <rect x="14" y="26" width="5" height="3" fill="black"/>
    <rect x="28" y="26" width="5" height="3" fill="black"/>
    <rect x="14" y="36" width="5" height="3" fill="black"/>
    <rect x="28" y="36" width="5" height="3" fill="black"/>`;
    
  // ============================================================
  // BARRIERS - Physical obstacles
  // ============================================================
  } else if (typeCode === 'OBBB') {
    // BUNKER - Fortified position symbol
    pattern = `<rect x="12" y="12" width="26" height="26" fill="none" stroke="black" stroke-width="2.5"/>
    <line x1="25" y1="12" x2="25" y2="38" stroke="black" stroke-width="2"/>
    <line x1="12" y1="25" x2="38" y2="25" stroke="black" stroke-width="2"/>
    <rect x="18" y="18" width="8" height="8" fill="black"/>`;
  } else if (typeCode === 'OBBT') {
    // TANK DITCH - V-shaped antitank ditch
    pattern = `<polyline points="8,42 18,15 32,15 42,42" fill="none" stroke="black" stroke-width="3"/>
    <line x1="15" y1="35" x2="18" y2="25" stroke="black" stroke-width="1.5" stroke-dasharray="2,2"/>
    <line x1="22" y1="35" x2="22" y2="25" stroke="black" stroke-width="1.5" stroke-dasharray="2,2"/>
    <line x1="29" y1="35" x2="32" y2="25" stroke="black" stroke-width="1.5" stroke-dasharray="2,2"/>`;
  } else if (typeCode === 'OBBC') {
    // CRATER - Irregular circular obstacle
    pattern = `<ellipse cx="25" cy="25" rx="14" ry="12" fill="none" stroke="black" stroke-width="2.5"/>
    <path d="M14,22 Q25,15 36,22" fill="none" stroke="black" stroke-width="1" stroke-dasharray="3,2"/>
    <path d="M14,30 Q25,38 36,30" fill="none" stroke="black" stroke-width="1" stroke-dasharray="3,2"/>
    <ellipse cx="25" cy="25" rx="5" ry="4" fill="none" stroke="black" stroke-width="1.5"/>`;
  } else if (typeCode === 'OBBLK' || typeCode === 'OBB') {
    // ROADBLOCK/ABATIS - Tree/wood barrier
    pattern = `<rect x="8" y="8" width="8" height="34" fill="black"/>
    <rect x="20" y="10" width="8" height="30" fill="black"/>
    <rect x="32" y="8" width="8" height="34" fill="black"/>
    <line x1="5" y1="6" x2="43" y2="6" stroke="black" stroke-width="2"/>
    <line x1="5" y1="44" x2="43" y2="44" stroke="black" stroke-width="2"/>`;
  } else if (typeCode === 'OBBW' || typeCode === 'OBBR') {
    // LOGICAL/REINFORCED - Timber framed structure
    pattern = `<line x1="15" y1="12" x2="15" y2="38" stroke="black" stroke-width="3"/>
    <line x1="25" y1="10" x2="25" y2="40" stroke="black" stroke-width="3"/>
    <line x1="35" y1="12" x2="35" y2="38" stroke="black" stroke-width="3"/>
    <line x1="10" y1="18" x2="40" y2="18" stroke="black" stroke-width="2"/>
    <line x1="10" y1="32" x2="40" y2="32" stroke="black" stroke-width="2"/>`;
  } else if (typeCode === 'OBBD') {
    // DEMOLITION - Explosive charge symbol
    pattern = `<circle cx="25" cy="25" r="12" fill="none" stroke="black" stroke-width="2.5"/>
    <line x1="25" y1="13" x2="25" y2="37" stroke="black" stroke-width="2"/>
    <line x1="13" y1="25" x2="37" y2="25" stroke="black" stroke-width="2"/>
    <line x1="16" y1="16" x2="34" y2="34" stroke="black" stroke-width="1.5"/>
    <line x1="16" y1="34" x2="34" y2="16" stroke="black" stroke-width="1.5"/>`;
  } else if (typeCode === 'OBBH') {
    // HESCO BARRIER - Collapsible mesh basket
    pattern = `<rect x="10" y="15" width="10" height="20" fill="none" stroke="black" stroke-width="2"/>
    <rect x="22" y="15" width="10" height="20" fill="none" stroke="black" stroke-width="2"/>
    <rect x="34" y="15" width="10" height="20" fill="none" stroke="black" stroke-width="2"/>
    <line x1="15" y1="15" x2="15" y2="35" stroke="black" stroke-width="1" stroke-dasharray="2,2"/>
    <line x1="27" y1="15" x2="27" y2="35" stroke="black" stroke-width="1" stroke-dasharray="2,2"/>
    <line x1="39" y1="15" x2="39" y2="35" stroke="black" stroke-width="1" stroke-dasharray="2,2"/>`;
  } else if (typeCode === 'OBF') {
    // FORD/Shallow crossing - Water and riverbed marks
    pattern = `<path d="M12,18 Q25,28 38,18" fill="none" stroke="blue" stroke-width="3"/>
    <path d="M12,32 Q25,22 38,32" fill="none" stroke="blue" stroke-width="3"/>
    <line x1="18" y1="22" x2="32" y2="32" stroke="brown" stroke-width="2"/>
    <line x1="32" y1="22" x2="18" y2="32" stroke="brown" stroke-width="2"/>`;
  } else if (typeCode === 'OBCNL') {
    // CANAL - Water channel with banks
    pattern = `<line x1="10" y1="20" x2="10" y2="30" stroke="blue" stroke-width="4"/>
    <line x1="40" y1="20" x2="40" y2="30" stroke="blue" stroke-width="4"/>
    <line x1="10" y1="20" x2="40" y2="20" stroke="blue" stroke-width="1.5"/>
    <line x1="10" y1="30" x2="40" y2="30" stroke="blue" stroke-width="1.5"/>
    <line x1="10" y1="25" x2="40" y2="25" stroke="white" stroke-width="0.5" stroke-dasharray="4,2"/>`;
    
  // ============================================================
  // EXISTING/NATURAL OBSTACLES
  // ============================================================
  } else if (typeCode === 'OBE' || typeCode === 'OBES') {
    // EXISTING/BUILT-UP AREA - Buildings and structures
    pattern = `<rect x="8" y="12" width="12" height="10" fill="none" stroke="black" stroke-width="2"/>
    <rect x="24" y="10" width="14" height="10" fill="none" stroke="black" stroke-width="2"/>
    <rect x="8" y="26" width="8" height="12" fill="none" stroke="black" stroke-width="2"/>
    <rect x="22" y="26" width="16" height="12" fill="none" stroke="black" stroke-width="2"/>
    <rect x="38" y="28" width="8" height="10" fill="none" stroke="black" stroke-width="2"/>
    <line x1="20" y1="12" x2="20" y2="38" stroke="black" stroke-width="1"/>`;
  } else if (typeCode === 'OBT') {
    // TUNNEL - Underground passage
    pattern = `<path d="M15,38 Q25,12 35,38" fill="none" stroke="black" stroke-width="2.5"/>
    <line x1="20" y1="34" x2="20" y2="40" stroke="black" stroke-width="2"/>
    <line x1="25" y1="28" x2="25" y2="40" stroke="black" stroke-width="2"/>
    <line x1="30" y1="34" x2="30" y2="40" stroke="black" stroke-width="2"/>`;
  } else if (typeCode === 'OBD') {
    // DEFILE/DITCH - Natural ditch/obstacle
    pattern = `<polygon points="10,38 18,15 26,38" fill="none" stroke="black" stroke-width="2.5"/>
    <polygon points="24,38 32,10 40,38" fill="none" stroke="black" stroke-width="2.5"/>
    <line x1="18" y1="25" x2="26" y2="28" stroke="black" stroke-width="1" stroke-dasharray="2,2"/>
    <line x1="32" y1="22" x2="40" y2="28" stroke="black" stroke-width="1" stroke-dasharray="2,2"/>`;
  } else if (typeCode.startsWith('OBER') || typeCode.startsWith('OBEW') || typeCode.startsWith('OBEF')) {
    // ENHANCED POSITION - Defended location with weapons
    pattern = `<circle cx="25" cy="25" r="14" fill="none" stroke="black" stroke-width="2.5"/>
    <line x1="25" y1="11" x2="25" y2="39" stroke="black" stroke-width="2"/>
    <line x1="11" y1="25" x2="39" y2="25" stroke="black" stroke-width="2"/>
    <circle cx="25" cy="25" r="5" fill="black"/>
    <line x1="25" y1="6" x2="22" y2="10" stroke="black" stroke-width="1.5"/>
    <line x1="25" y1="6" x2="28" y2="10" stroke="black" stroke-width="1.5"/>`;
  } else {
    // GENERIC OBSTACLE - Default X mark
    pattern = `<rect x="10" y="10" width="30" height="30" fill="none" stroke="black" stroke-width="2"/>
    <line x1="18" y1="18" x2="32" y2="32" stroke="black" stroke-width="2"/>
    <line x1="32" y1="18" x2="18" y2="32" stroke="black" stroke-width="2"/>`;
  }
  
  return `<svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="5" width="40" height="40" fill="${color}" stroke="black" stroke-width="2"/>
    ${pattern}
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
