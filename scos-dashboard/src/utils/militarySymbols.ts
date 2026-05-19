import type { UnitAffiliation, UnitEchelon, UnitModifiers } from '../types/units';
import { OBSTACLE_TYPES, type ObstacleTypeCode } from '../types/obstacles';

// ============================================================
//  UNIT SYMBOLS
// ============================================================

// Map unit code to shape identifier only (frame is affiliation‑based)
const unitShapeMap: Record<string, string> = {
  'I': 'infantry',
  'M': 'armor',
  'A': 'artillery',
  'E': 'engineer',
  'C': 'cavalry',
  'AV': 'aviation',
  'ADA': 'airdefense',
  // Add more as needed
};

// Affiliation colors (fill only; stroke is always black)
const affiliationColors: Record<UnitAffiliation, { fill: string }> = {
  friendly: { fill: 'rgb(128,224,255)' },   // light blue
  hostile:  { fill: 'rgb(255,128,128)' },   // light red
  neutral:  { fill: 'rgb(128,255,128)' },   // light green
  unknown:  { fill: 'rgb(192,192,192)' },   // light gray
};

// Readable unit names for the <desc> element
function getUnitName(unitCode: string): string {
  const names: Record<string, string> = {
    'I': 'Infantry',
    'M': 'Armor',
    'A': 'Artillery',
    'E': 'Engineer',
    'C': 'Cavalry',
    'AV': 'Aviation',
    'ADA': 'Air Defense',
  };
  return names[unitCode] || unitCode;
}

// Draw the inner symbol (decorator)
function drawDecoratorShape(shape: string): string {
  const centerX = 25;
  const centerY = 25;
  switch (shape) {
    case 'infantry':
      return `<line x1="15" y1="15" x2="35" y2="35" stroke="black" stroke-width="3"/>
              <line x1="35" y1="15" x2="15" y2="35" stroke="black" stroke-width="3"/>`;
    case 'armor':
      // Rounded rectangle (track)
      return `<path d="M15,15 L35,15 A5,5 0 0 1 35,25 L35,35 A5,5 0 0 1 25,35 L15,35 A5,5 0 0 1 15,25 Z" fill="none" stroke="black" stroke-width="3"/>`;
    case 'artillery':
      return `<circle cx="${centerX}" cy="${centerY}" r="12" fill="none" stroke="black" stroke-width="3"/>`;
    case 'engineer':
      return `<rect x="12" y="20" width="26" height="10" fill="none" stroke="black" stroke-width="2"/>
              <line x1="12" y1="20" x2="12" y2="30" stroke="black" stroke-width="2"/>
              <line x1="38" y1="20" x2="38" y2="30" stroke="black" stroke-width="2"/>`;
    case 'cavalry':
      return `<line x1="10" y1="25" x2="40" y2="25" stroke="black" stroke-width="3" stroke-dasharray="4,4"/>`;
    case 'aviation':
      return `<circle cx="${centerX}" cy="${centerY}" r="8" fill="none" stroke="black" stroke-width="2"/>
              <line x1="${centerX}" y1="10" x2="${centerX}" y2="40" stroke="black" stroke-width="2"/>
              <line x1="10" y1="${centerY}" x2="40" y2="${centerY}" stroke="black" stroke-width="2"/>`;
    case 'airdefense':
      return `<polygon points="25,15 35,35 15,35" fill="none" stroke="black" stroke-width="3"/>`;
    default:
      return `<rect x="12" y="12" width="26" height="26" fill="none" stroke="black" stroke-width="3"/>`;
  }
}

// Draw the frame based on affiliation
function drawFrameByAffiliation(affiliation: UnitAffiliation, fill: string): string {
  const frameMap: Record<UnitAffiliation, { type: 'rect' | 'diamond' | 'square'; width?: number; height?: number }> = {
    friendly: { type: 'rect', width: 40, height: 30 },
    hostile: { type: 'diamond' },
    neutral: { type: 'square', width: 35, height: 35 },
    unknown: { type: 'square', width: 35, height: 35 },
  };
  const frame = frameMap[affiliation] || { type: 'rect', width: 35, height: 35 };
  return drawFrame(frame.type, fill, frame.width, frame.height);
}

// Draw the frame (rectangle, diamond, or square)
function drawFrame(type: 'rect' | 'diamond' | 'square', fill: string, width?: number, height?: number): string {
  if (type === 'rect') {
    const w = width ?? 35;
    const h = height ?? 35;
    const x = (50 - w) / 2;
    const y = (50 - h) / 2;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="black" stroke-width="3" />`;
  } else if (type === 'square') {
    const size = width ?? 35;
    const x = (50 - size) / 2;
    const y = (50 - size) / 2;
    return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${fill}" stroke="black" stroke-width="3" />`;
  } else {
    // Diamond
    return `<path stroke="black" stroke-width="3" d="M5,25 L25,5 L45,25 L25,45 Z" fill="${fill}" />`;
  }
}

// Draw echelon indicators (dots, bars, cross) above the frame
function drawEchelon(echelon: UnitEchelon): string {
  const indicators: Record<UnitEchelon, { type: 'dots' | 'bars' | 'cross'; count: number } | null> = {
    none: null,
    team: null,
    squad: { type: 'dots', count: 1 },
    section: { type: 'dots', count: 2 },
    platoon: { type: 'dots', count: 3 },
    company: { type: 'bars', count: 1 },
    battalion: { type: 'bars', count: 2 },
    regiment: { type: 'bars', count: 3 },
    brigade: { type: 'cross', count: 1 },
    division: { type: 'cross', count: 1 },
    corps: { type: 'cross', count: 1 },
    army: { type: 'cross', count: 1 },
  };
  const indicator = indicators[echelon];
  if (!indicator) return '';

  const xCenter = 25;
  const yPos = 8; // above the frame

  if (indicator.type === 'dots') {
    const dotRadius = 2;
    const spacing = 5;
    const startX = xCenter - (indicator.count - 1) * spacing / 2;
    let dots = '';
    for (let i = 0; i < indicator.count; i++) {
      const cx = startX + i * spacing;
      dots += `<circle cx="${cx}" cy="${yPos}" r="${dotRadius}" fill="black"/>`;
    }
    return dots;
  } else if (indicator.type === 'bars') {
    const barWidth = 3;
    const barHeight = 6;
    const spacing = 4;
    const startX = xCenter - (indicator.count - 1) * (barWidth + spacing) / 2;
    let bars = '';
    for (let i = 0; i < indicator.count; i++) {
      const x = startX + i * (barWidth + spacing);
      bars += `<rect x="${x}" y="${yPos - barHeight/2}" width="${barWidth}" height="${barHeight}" fill="black"/>`;
    }
    return bars;
  } else if (indicator.type === 'cross') {
    const size = 8;
    return `<line x1="${xCenter - size/2}" y1="${yPos - size/2}" x2="${xCenter + size/2}" y2="${yPos + size/2}" stroke="black" stroke-width="2"/>
            <line x1="${xCenter + size/2}" y1="${yPos - size/2}" x2="${xCenter - size/2}" y2="${yPos + size/2}" stroke="black" stroke-width="2"/>`;
  }
  return '';
}

/**
 * Create a unit symbol SVG string.
 */
export function createUnitSymbol(
  unitCode: string,
  affiliation: UnitAffiliation,
  echelon?: UnitEchelon,
  modifiers?: UnitModifiers
): string | null {
  const shape = unitShapeMap[unitCode] || 'generic';
  const color = affiliationColors[affiliation] || affiliationColors.unknown;
  const unitName = getUnitName(unitCode);

  let svg = `<svg class="draggable" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
    <desc>
      Affiliation: ${affiliation}
      Echelon: ${echelon || 'none'}
      Symbol: ${unitName}
      ${modifiers?.headquarters ? 'Headquarters: true' : ''}
      ${modifiers?.taskForce ? 'Task Force: true' : ''}
    </desc>
    ${drawFrameByAffiliation(affiliation, color.fill)}
    <g class="decorator">
      ${drawDecoratorShape(shape)}
    </g>
  `;

  if (echelon && echelon !== 'none') {
    svg += drawEchelon(echelon);
  }

  if (modifiers?.headquarters) {
    svg += `<polygon points="42,8 45,14 39,14 42,8" fill="gold" stroke="black" stroke-width="1" />`;
  }

  if (modifiers?.taskForce) {
    svg += `<text x="42" y="45" font-size="8" font-weight="bold" fill="black" text-anchor="middle">TF</text>`;
  }

  svg += `</svg>`;
  return svg;
}

// ============================================================
//  OBSTACLE SYMBOLS – IMPROVED PATTERNS
// ============================================================

// Map obstacle type codes to the pattern identifier
const obstaclePatternMap: Record<ObstacleTypeCode, string> = {
  // Wire obstacles
  'OBWL': 'wire', 'OBWH': 'wire', 'OBW': 'wire', 'OBWC': 'wire', 'OBWD': 'wire', 'OBWT': 'wire',
  // Mines
  'OMP': 'mine', 'OMPA': 'mine', 'OMPD': 'mine', 'OMPF': 'mine', 'OMPB': 'mine',
  'OMT': 'mine', 'OMTA': 'mine', 'OMTD': 'mine', 'OMTS': 'mine', 'OMD': 'mine',
  'OME': 'mine', 'OMW': 'mine', 'OMU': 'mine',
  // Barriers
  'OBB': 'barrier', 'OBBR': 'barrier', 'OBBW': 'barrier', 'OBBV': 'barrier',
  'OBBH': 'barrier', 'OBBD': 'barrier', 'OBBB': 'barrier',
  'OBBT': 'ditch',     // Tank ditch
  'OBBC': 'crater',    // Crater
  'OBER': 'water', 'OBEW': 'water',
  'OBEF': 'forest',
  // Existing and effects use generic
  'OBE': 'generic', 'OBES': 'generic', 'OBT': 'generic', 'OBD': 'generic',
  'OBBLK': 'generic', 'OBF': 'generic', 'OBCNL': 'generic',
};

/**
 * Draw the obstacle pattern inside the circle.
 */
function drawObstaclePattern(pattern: string): string {
  const centerX = 25;
  const centerY = 25;
  const size = 20; // radius of the inner drawing area

  switch (pattern) {
    case 'wire':
      // Barbed wire: zigzag with barbs
      return `<polyline points="10,20 15,25 20,20 25,25 30,20 35,25 40,20" fill="none" stroke="black" stroke-width="2"/>
              <circle cx="13" cy="21" r="1" fill="black"/>
              <circle cx="23" cy="22" r="1" fill="black"/>
              <circle cx="33" cy="23" r="1" fill="black"/>
              <circle cx="38" cy="21" r="1" fill="black"/>`;

    case 'mine':
      // Minefield: multiple small mines with a central mine (circle with cross)
      return `<circle cx="15" cy="15" r="2" fill="black"/>
              <circle cx="35" cy="35" r="2" fill="black"/>
              <circle cx="25" cy="20" r="2" fill="black"/>
              <circle cx="30" cy="30" r="2" fill="black"/>
              <circle cx="20" cy="30" r="2" fill="black"/>
              <circle cx="28" cy="22" r="2" fill="black"/>
              <circle cx="32" cy="28" r="2" fill="black"/>
              <!-- central mine (larger) -->
              <circle cx="25" cy="25" r="3" fill="none" stroke="black" stroke-width="2"/>
              <line x1="25" y1="22" x2="25" y2="28" stroke="black" stroke-width="2"/>
              <line x1="22" y1="25" x2="28" y2="25" stroke="black" stroke-width="2"/>`;

    case 'ditch':
      // Tank ditch: V‑shaped trench with cross‑hatch
      return `<polyline points="10,35 25,15 40,35" fill="none" stroke="black" stroke-width="3"/>
              <line x1="15" y1="32" x2="25" y2="20" stroke="black" stroke-width="1.5" stroke-dasharray="3,3"/>
              <line x1="35" y1="32" x2="25" y2="20" stroke="black" stroke-width="1.5" stroke-dasharray="3,3"/>
              <polygon points="23,28 27,28 25,32" fill="none" stroke="black" stroke-width="1"/>`;

    case 'barrier':
      // Barrier: vertical slats
      return `<rect x="15" y="15" width="20" height="20" fill="none" stroke="black" stroke-width="2"/>
              <line x1="20" y1="15" x2="20" y2="35" stroke="black" stroke-width="2"/>
              <line x1="30" y1="15" x2="30" y2="35" stroke="black" stroke-width="2"/>
              <line x1="25" y1="15" x2="25" y2="35" stroke="black" stroke-width="2"/>`;

    case 'crater':
      // Crater: irregular depression
      return `<path d="M15,30 Q20,20 25,25 Q30,18 35,28" fill="none" stroke="black" stroke-width="2"/>
              <path d="M16,32 Q20,28 24,31 Q28,26 34,30" fill="none" stroke="black" stroke-width="2" stroke-dasharray="3,3"/>`;

    case 'water':
      // Water: wavy lines (two parallel waves)
      return `<path d="M10,30 Q15,25 20,30 Q25,35 30,30 Q35,25 40,30" fill="none" stroke="black" stroke-width="2"/>
              <path d="M10,35 Q15,30 20,35 Q25,40 30,35 Q35,30 40,35" fill="none" stroke="black" stroke-width="2"/>`;

    case 'forest':
      // Forest: three trees (triangle + trunk)
      return `<polygon points="15,32 20,20 25,32" fill="none" stroke="black" stroke-width="1.5"/>
              <rect x="18" y="32" width="4" height="6" fill="none" stroke="black" stroke-width="1.5"/>
              <polygon points="25,30 30,18 35,30" fill="none" stroke="black" stroke-width="1.5"/>
              <rect x="28" y="30" width="4" height="8" fill="none" stroke="black" stroke-width="1.5"/>
              <polygon points="35,28 40,16 45,28" fill="none" stroke="black" stroke-width="1.5"/>
              <rect x="38" y="28" width="4" height="8" fill="none" stroke="black" stroke-width="1.5"/>`;

    default:
      // Generic: an X
      return `<line x1="15" y1="15" x2="35" y2="35" stroke="black" stroke-width="2"/>
              <line x1="35" y1="15" x2="15" y2="35" stroke="black" stroke-width="2"/>`;
  }
}

export function createObstacleSymbol(typeCode: ObstacleTypeCode): string | null {
  const obstacle = OBSTACLE_TYPES[typeCode];
  if (!obstacle) return null;

  const pattern = obstaclePatternMap[typeCode] || 'generic';
  return `<svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
    <circle cx="25" cy="25" r="20" fill="#e0e0c0" stroke="black" stroke-width="2"/>
    ${drawObstaclePattern(pattern)}
  </svg>`;
}
// ============================================================
//  FALLBACK
// ============================================================

export function fallbackSVG(text: string): string {
  const display = text.length > 8 ? text.slice(0, 6) + '…' : text;
  return `<svg width="50" height="50" viewBox="0 0 50 50">
    <circle cx="25" cy="25" r="22" fill="#2e3b2e" stroke="#e0e0c0" stroke-width="2"/>
    <text x="25" y="30" font-size="10" fill="white" text-anchor="middle">${display}</text>
  </svg>`;
}


 