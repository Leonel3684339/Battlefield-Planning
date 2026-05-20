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
  // Pattern based on obstacle type - matching MIL-STD-2525 tactical graphics style
  let pattern = '';
  const color = '#E0E0C0'; // Tan/sand color for obstacles
  
  // Wire obstacles - straight lines with specific styling
  if (typeCode === 'OBWL' || typeCode === 'OBW') {
    // Low wire - single line with posts
    pattern = `<line x1="10" y1="25" x2="40" y2="25" stroke="black" stroke-width="2"/>
    <line x1="10" y1="25" x2="10" y2="15" stroke="black" stroke-width="1.5"/>
    <line x1="25" y1="25" x2="25" y2="18" stroke="black" stroke-width="1.5"/>
    <line x1="40" y1="25" x2="40" y2="15" stroke="black" stroke-width="1.5"/>`;
  } else if (typeCode === 'OBWH') {
    // High wire - higher line with taller posts
    pattern = `<line x1="10" y1="22" x2="40" y2="22" stroke="black" stroke-width="2"/>
    <line x1="10" y1="22" x2="10" y2="10" stroke="black" stroke-width="1.5"/>
    <line x1="25" y1="22" x2="25" y2="10" stroke="black" stroke-width="1.5"/>
    <line x1="40" y1="22" x2="40" y2="10" stroke="black" stroke-width="1.5"/>
    <line x1="10" y1="22" x2="40" y2="22" stroke="black" stroke-width="1.5" stroke-dasharray="4,2"/>`;
  } else if (typeCode === 'OBWC') {
    // Concertina - spiral/coil pattern
    pattern = `<ellipse cx="25" cy="25" rx="10" ry="5" fill="none" stroke="black" stroke-width="2"/>
    <ellipse cx="25" cy="25" rx="6" ry="3" fill="none" stroke="black" stroke-width="1.5"/>
    <circle cx="18" cy="25" r="2" fill="black"/>
    <circle cx="32" cy="25" r="2" fill="black"/>`;
  } else if (typeCode === 'OBWD') {
    // Double apron - two parallel lines with crossbars
    pattern = `<line x1="10" y1="20" x2="40" y2="20" stroke="black" stroke-width="2"/>
    <line x1="10" y1="30" x2="40" y2="30" stroke="black" stroke-width="2"/>
    <line x1="15" y1="20" x2="15" y2="30" stroke="black" stroke-width="1.5"/>
    <line x1="25" y1="20" x2="25" y2="30" stroke="black" stroke-width="1.5"/>
    <line x1="35" y1="20" x2="35" y2="30" stroke="black" stroke-width="1.5"/>`;
  } else if (typeCode === 'OBWT') {
    // Triple concertina
    pattern = `<ellipse cx="20" cy="22" rx="8" ry="4" fill="none" stroke="black" stroke-width="1.5"/>
    <ellipse cx="30" cy="22" rx="8" ry="4" fill="none" stroke="black" stroke-width="1.5"/>
    <ellipse cx="25" cy="30" rx="8" ry="4" fill="none" stroke="black" stroke-width="1.5"/>
    <line x1="12" y1="18" x2="38" y2="36" stroke="black" stroke-width="1" stroke-dasharray="3,2"/>`;
    
  // Minefields - scattered circles representing mines
  } else if (typeCode === 'OMP' || typeCode === 'OMPA') {
    // Antitank mine - rectangular with center detail
    pattern = `<rect x="18" y="20" width="14" height="10" fill="black" stroke="black" stroke-width="1"/>
    <rect x="20" y="22" width="10" height="6" fill="none" stroke="white" stroke-width="1"/>
    <circle cx="25" cy="25" r="2" fill="white"/>`;
  } else if (typeCode === 'OMPB' || typeCode === 'OMP' || typeCode.startsWith('OM')) {
    // Generic minefield - scattered mines
    pattern = `<rect x="15" y="15" width="6" height="4" fill="black"/>
    <rect x="30" y="18" width="6" height="4" fill="black"/>
    <rect x="22" y="28" width="6" height="4" fill="black"/>
    <rect x="38" y="32" width="6" height="4" fill="black"/>
    <rect x="12" y="35" width="6" height="4" fill="black"/>
    <rect x="28" y="12" width="6" height="4" fill="black"/>`;
  } else if (typeCode === 'OMTS') {
    // Scatterable mines - row pattern
    pattern = `<circle cx="12" cy="25" r="3" fill="black"/>
    <circle cx="20" cy="25" r="3" fill="black"/>
    <circle cx="28" cy="25" r="3" fill="black"/>
    <circle cx="36" cy="25" r="3" fill="black"/>
    <line x1="10" y1="32" x2="10" y2="40" stroke="black" stroke-width="1.5"/>
    <line x1="25" y1="32" x2="25" y2="40" stroke="black" stroke-width="1.5"/>`;
  } else if (typeCode === 'OMD') {
    // AT ditch - continuous line with hatched marks
    pattern = `<path d="M10,40 L15,20 L25,20 L30,40" fill="none" stroke="black" stroke-width="2"/>
    <line x1="17" y1="25" x2="17" y2="35" stroke="black" stroke-width="1" stroke-dasharray="2,2"/>
    <line x1="22" y1="25" x2="22" y2="38" stroke="black" stroke-width="1" stroke-dasharray="2,2"/>
    <line x1="27" y1="25" x2="27" y2="35" stroke="black" stroke-width="1" stroke-dasharray="2,2"/>`;
    
  // Barriers
  } else if (typeCode === 'OBBB') {
    // Bunker - square with diagonal cross
    pattern = `<rect x="15" y="15" width="20" height="20" fill="none" stroke="black" stroke-width="2"/>
    <line x1="15" y1="15" x2="35" y2="35" stroke="black" stroke-width="2"/>
    <line x1="35" y1="15" x2="15" y2="35" stroke="black" stroke-width="2"/>`;
  } else if (typeCode === 'OBBT') {
    // Tank ditch - V-shape trench
    pattern = `<polyline points="10,40 25,20 40,40" fill="none" stroke="black" stroke-width="3"/>
    <line x1="15" y1="35" x2="20" y2="28" stroke="black" stroke-width="1" stroke-dasharray="2,2"/>
    <line x1="20" y1="35" x2="25" y2="25" stroke="black" stroke-width="1" stroke-dasharray="2,2"/>
    <line x1="30" y1="35" x2="25" y2="25" stroke="black" stroke-width="1" stroke-dasharray="2,2"/>
    <line x1="35" y1="35" x2="30" y2="28" stroke="black" stroke-width="1" stroke-dasharray="2,2"/>`;
  } else if (typeCode === 'OBBC') {
    // Crater - irregular circle
    pattern = `<ellipse cx="25" cy="25" rx="12" ry="10" fill="none" stroke="black" stroke-width="2"/>
    <path d="M18,22 Q25,18 32,22" fill="none" stroke="black" stroke-width="1" stroke-dasharray="2,2"/>
    <path d="M18,28 Q25,32 32,28" fill="none" stroke="black" stroke-width="1" stroke-dasharray="2,2"/>`;
  } else if (typeCode === 'OBBLK' || typeCode === 'OBB') {
    // Block - vertical barrier
    pattern = `<rect x="15" y="18" width="6" height="18" fill="black"/>
    <rect x="23" y="15" width="6" height="24" fill="black"/>
    <rect x="31" y="20" width="6" height="14" fill="black"/>
    <line x1="10" y1="12" x2="40" y2="12" stroke="black" stroke-width="2"/>
    <line x1="10" y1="42" x2="40" y2="42" stroke="black" stroke-width="2"/>`;
  } else if (typeCode === 'OBBW' || typeCode === 'OBBR') {
    // Wooden/Reinforced - timber pattern
    pattern = `<line x1="18" y1="15" x2="18" y2="35" stroke="black" stroke-width="3"/>
    <line x1="25" y1="15" x2="25" y2="35" stroke="black" stroke-width="3"/>
    <line x1="32" y1="15" x2="32" y2="35" stroke="black" stroke-width="3"/>
    <line x1="15" y1="20" x2="35" y2="20" stroke="black" stroke-width="2"/>
    <line x1="15" y1="30" x2="35" y2="30" stroke="black" stroke-width="2"/>`;
  } else if (typeCode === 'OBBD') {
    // Demo - explosive charge symbol
    pattern = `<circle cx="25" cy="25" r="8" fill="none" stroke="black" stroke-width="2"/>
    <line x1="25" y1="15" x2="25" y2="35" stroke="black" stroke-width="2"/>
    <line x1="15" y1="25" x2="35" y2="25" stroke="black" stroke-width="2"/>
    <line x1="18" y1="18" x2="32" y2="32" stroke="black" stroke-width="1.5"/>
    <line x1="18" y1="32" x2="32" y2="18" stroke="black" stroke-width="1.5"/>`;
  } else if (typeCode === 'OBBH') {
    // Hebco - hesco barrier
    pattern = `<rect x="15" y="20" width="8" height="14" fill="none" stroke="black" stroke-width="2"/>
    <rect x="27" y="20" width="8" height="14" fill="none" stroke="black" stroke-width="2"/>
    <line x1="23" y1="15" x2="23" y2="39" stroke="black" stroke-width="2"/>
    <line x1="15" y1="27" x2="19" y2="27" stroke="black" stroke-width="1.5"/>
    <line x1="31" y1="27" x2="35" y2="27" stroke="black" stroke-width="1.5"/>`;
  } else if (typeCode === 'OBF') {
    // Ford - crossed water marks
    pattern = `<path d="M15,15 Q25,25 35,15" fill="none" stroke="blue" stroke-width="2"/>
    <path d="M15,35 Q25,25 35,35" fill="none" stroke="blue" stroke-width="2"/>
    <line x1="20" y1="20" x2="30" y2="30" stroke="brown" stroke-width="1.5"/>
    <line x1="30" y1="20" x2="20" y2="30" stroke="brown" stroke-width="1.5"/>`;
  } else if (typeCode === 'OBCNL') {
    // Canal - parallel water lines
    pattern = `<line x1="12" y1="18" x2="12" y2="32" stroke="blue" stroke-width="3"/>
    <line x1="38" y1="18" x2="38" y2="32" stroke="blue" stroke-width="3"/>
    <line x1="12" y1="25" x2="38" y2="25" stroke="blue" stroke-width="1" stroke-dasharray="3,2"/>`;
    
  // Existing/Natural
  } else if (typeCode === 'OBE' || typeCode === 'OBES') {
    // Existing/built-up area - building outlines
    pattern = `<rect x="12" y="15" width="10" height="8" fill="none" stroke="black" stroke-width="1.5"/>
    <rect x="26" y="15" width="12" height="8" fill="none" stroke="black" stroke-width="1.5"/>
    <rect x="12" y="27" width="8" height="10" fill="none" stroke="black" stroke-width="1.5"/>
    <rect x="24" y="27" width="14" height="10" fill="none" stroke="black" stroke-width="1.5"/>`;
  } else if (typeCode === 'OBT') {
    // Tunnel - arc with lines
    pattern = `<path d="M15,35 Q25,15 35,35" fill="none" stroke="black" stroke-width="2"/>
    <line x1="18" y1="32" x2="18" y2="38" stroke="black" stroke-width="1.5"/>
    <line x1="25" y1="25" x2="25" y2="38" stroke="black" stroke-width="1.5"/>
    <line x1="32" y1="32" x2="32" y2="38" stroke="black" stroke-width="1.5"/>`;
  } else if (typeCode === 'OBD') {
    // Defile - mountain peaks
    pattern = `<polygon points="15,35 20,20 25,35" fill="none" stroke="black" stroke-width="2"/>
    <polygon points="22,35 28,15 34,35" fill="none" stroke="black" stroke-width="2"/>
    <polygon points="30,35 36,25 42,35" fill="none" stroke="black" stroke-width="2"/>
    <line x1="20" y1="25" x2="28" y2="20" stroke="black" stroke-width="1" stroke-dasharray="2,2"/>`;
  } else if (typeCode.startsWith('OBER') || typeCode.startsWith('OBEW') || typeCode.startsWith('OBEF')) {
    // Enhanced - with radar/weapon symbols
    pattern = `<circle cx="25" cy="25" r="10" fill="none" stroke="black" stroke-width="2"/>
    <line x1="25" y1="15" x2="25" y2="35" stroke="black" stroke-width="1.5"/>
    <line x1="15" y1="25" x2="35" y2="25" stroke="black" stroke-width="1.5"/>
    <circle cx="25" cy="25" r="3" fill="black"/>`;
  } else {
    // Generic obstacle - X mark
    pattern = `<line x1="18" y1="18" x2="32" y2="32" stroke="black" stroke-width="2"/>
    <line x1="32" y1="18" x2="18" y2="32" stroke="black" stroke-width="2"/>`;
  }
  
  return `<svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
    <circle cx="25" cy="25" r="20" fill="${color}" stroke="black" stroke-width="2"/>
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
