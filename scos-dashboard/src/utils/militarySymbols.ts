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
  // Pattern based on obstacle type
  let pattern = '';
  const color = '#E0E0C0'; // Tan/sand color
  
  if (typeCode.startsWith('OBW')) {
    // Wire - zigzag lines with barbs
    pattern = `<polyline points="15,30 20,25 25,30 30,25 35,30 40,25 45,30" fill="none" stroke="black" stroke-width="2"/>
    <circle cx="17" cy="28" r="1.5" fill="black"/>
    <circle cx="27" cy="26" r="1.5" fill="black"/>
    <circle cx="37" cy="28" r="1.5" fill="black"/>
    <circle cx="43" cy="27" r="1.5" fill="black"/>`;
  } else if (typeCode.startsWith('OM')) {
    // Mines - scattered circles with central mine
    pattern = `<circle cx="20" cy="20" r="3" fill="black"/>
    <circle cx="35" cy="35" r="3" fill="black"/>
    <circle cx="25" cy="30" r="3" fill="black"/>
    <circle cx="40" cy="20" r="3" fill="black"/>
    <circle cx="30" cy="40" r="3" fill="black"/>
    <circle cx="15" cy="35" r="3" fill="black"/>
    <circle cx="25" cy="25" r="4" fill="none" stroke="black" stroke-width="2"/>`;
  } else if (typeCode === 'OBBT') {
    // Tank ditch - V shape with crosshatch
    pattern = `<polyline points="15,40 25,20 35,40" fill="none" stroke="black" stroke-width="3"/>
    <line x1="20" y1="35" x2="25" y2="25" stroke="black" stroke-width="1.5" stroke-dasharray="3,3"/>
    <line x1="30" y1="35" x2="25" y2="25" stroke="black" stroke-width="1.5" stroke-dasharray="3,3"/>`;
  } else if (typeCode === 'OBBC') {
    // Crater - irregular curves
    pattern = `<path d="M20,35 Q25,25 30,30 Q35,20 40,30" fill="none" stroke="black" stroke-width="2"/>
    <path d="M22,38 Q25,32 28,35 Q32,28 38,35" fill="none" stroke="black" stroke-width="2" stroke-dasharray="3,3"/>`;
  } else if (typeCode.startsWith('OBB')) {
    // Barriers - vertical slats
    pattern = `<rect x="20" y="20" width="25" height="25" fill="none" stroke="black" stroke-width="2"/>
    <line x1="25" y1="20" x2="25" y2="45" stroke="black" stroke-width="2"/>
    <line x1="32" y1="20" x2="32" y2="45" stroke="black" stroke-width="2"/>
    <line x1="39" y1="20" x2="39" y2="45" stroke="black" stroke-width="2"/>`;
  } else if (typeCode.startsWith('OBE')) {
    // Existing/natural - tree shapes
    pattern = `<polygon points="20,35 25,20 30,35" fill="none" stroke="black" stroke-width="2"/>
    <rect x="23" y="35" width="4" height="6" fill="none" stroke="black" stroke-width="2"/>
    <polygon points="35,30 40,15 45,30" fill="none" stroke="black" stroke-width="2"/>
    <rect x="38" y="30" width="4" height="8" fill="none" stroke="black" stroke-width="2"/>`;
  } else {
    // Generic - X mark
    pattern = `<line x1="20" y1="20" x2="40" y2="40" stroke="black" stroke-width="3"/>
    <line x1="40" y1="20" x2="20" y2="40" stroke="black" stroke-width="3"/>`;
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
