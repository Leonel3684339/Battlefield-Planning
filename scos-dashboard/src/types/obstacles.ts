export type ObstacleFamily = 
  | 'wire' 
  | 'minefield' 
  | 'barrier' 
  | 'existing' 
  | 'effect';

export interface ObstacleType {
  code: string;
  name: string;
  family: ObstacleFamily;
  description?: string;
  doctrinalPurpose?: string;
  defaultRadius?: number;
}

export const OBSTACLE_TYPES: Record<string, ObstacleType> = {
  // Wire obstacles
  OBWL: { code: 'OBWL', name: 'Low Wire Fence', family: 'wire', description: 'Simple wire fence, low silhouette', doctrinalPurpose: 'Disrupt and delay dismounted infantry.', defaultRadius: 50 },
  OBWH: { code: 'OBWH', name: 'High Wire Fence', family: 'wire', description: 'High wire fence, vehicle entanglement', doctrinalPurpose: 'Turn or disrupt vehicles.', defaultRadius: 50 },
  OBW: { code: 'OBW', name: 'Wire Obstacle (General)', family: 'wire', description: 'General wire entanglement', doctrinalPurpose: 'General obstacle to slow enemy.', defaultRadius: 50 },
  OBWC: { code: 'OBWC', name: 'Concertina Wire', family: 'wire', description: 'Coiled barbed wire/concer-tina', doctrinalPurpose: 'Quickly emplaced barrier for dismounts.', defaultRadius: 30 },
  OBWD: { code: 'OBWD', name: 'Double Apron Wire', family: 'wire', description: 'Double-strand fence with angled supports', doctrinalPurpose: 'More substantial wire barrier.', defaultRadius: 60 },
  OBWT: { code: 'OBWT', name: 'Triple Concertina', family: 'wire', description: 'Three coils concertina wire', doctrinalPurpose: 'High‑density wire obstacle.', defaultRadius: 40 },
  
  // Minefields
  OMP: { code: 'OMP', name: 'AP Mine (General)', family: 'minefield', description: 'Antipersonnel mine, any type', doctrinalPurpose: 'Casualty production and area denial.', defaultRadius: 100 },
  OMPA: { code: 'OMPA', name: 'AP Bounding Mine', family: 'minefield', description: 'Bounding fragmentation', doctrinalPurpose: 'Increased casualty radius.', defaultRadius: 80 },
  OMPD: { code: 'OMPD', name: 'AP Directional (Claymore)', family: 'minefield', description: 'Claymore-type', doctrinalPurpose: 'Directed fragmentation against dismounts.', defaultRadius: 60 },
  OMPF: { code: 'OMPF', name: 'AP Fragmentation', family: 'minefield', description: 'Fragmentation mine', doctrinalPurpose: 'Area denial via fragmentation.', defaultRadius: 80 },
  OMPB: { code: 'OMPB', name: 'AP Blast Mine', family: 'minefield', description: 'Blast-effect mine', doctrinalPurpose: 'Mainly anti‑personnel blast.', defaultRadius: 70 },
  OMT: { code: 'OMT', name: 'AT Mine (General)', family: 'minefield', description: 'Antitank mine, any type', doctrinalPurpose: 'Destroy or disable vehicles.', defaultRadius: 100 },
  OMTA: { code: 'OMTA', name: 'AT Blast Mine', family: 'minefield', description: 'Blast-effect AT mine', doctrinalPurpose: 'Blast through vehicle armor.', defaultRadius: 100 },
  OMTD: { code: 'OMTD', name: 'AT Directional Mine', family: 'minefield', description: 'Directional AT mine', doctrinalPurpose: 'Shaped charge against armor.', defaultRadius: 80 },
  OMTS: { code: 'OMTS', name: 'AT Scatterable', family: 'minefield', description: 'Scatterable AT mine', doctrinalPurpose: 'Rapidly delivered minefield.', defaultRadius: 120 },
  OMD: { code: 'OMD', name: 'AT with Antihandling', family: 'minefield', description: 'AT mine with anti-handling device', doctrinalPurpose: 'Prevents mine removal.', defaultRadius: 100 },
  OME: { code: 'OME', name: 'AT Directional (other)', family: 'minefield', description: 'Directional AT mine', doctrinalPurpose: 'Alternative directional AT.', defaultRadius: 80 },
  OMW: { code: 'OMW', name: 'Wide Area Mine', family: 'minefield', description: 'WAM (Wide Area Munition)', doctrinalPurpose: 'Extended range antitank mine.', defaultRadius: 200 },
  OMU: { code: 'OMU', name: 'Unspecified Mine', family: 'minefield', description: 'Mine, type unknown', doctrinalPurpose: 'Generic mine.', defaultRadius: 100 },
  
  // Barriers
  OBB: { code: 'OBB', name: 'Barrier (General)', family: 'barrier', description: 'General barrier symbol', doctrinalPurpose: 'General obstacle.', defaultRadius: 50 },
  OBBT: { code: 'OBBT', name: 'Tank Ditch', family: 'barrier', description: 'Anti-tank ditch', doctrinalPurpose: 'Stop or turn armored vehicles.', defaultRadius: 150 },
  OBBR: { code: 'OBBR', name: 'Roadblock', family: 'barrier', description: 'Deliberate roadblock', doctrinalPurpose: 'Block key terrain.', defaultRadius: 50 },
  OBBC: { code: 'OBBC', name: 'Crater', family: 'barrier', description: 'Explosively-formed crater', doctrinalPurpose: 'Deny passage on roads.', defaultRadius: 80 },
  OBBW: { code: 'OBBW', name: 'Log Wall', family: 'barrier', description: 'Log crib/barrier', doctrinalPurpose: 'Field‑expedient barrier.', defaultRadius: 40 },
  OBBV: { code: 'OBBV', name: 'Vehicle Barrier', family: 'barrier', description: 'Vehicle obstacle', doctrinalPurpose: 'Stop vehicles.', defaultRadius: 60 },
  OBBH: { code: 'OBBH', name: 'Hedgehog', family: 'barrier', description: 'Steel anti-tank hedgehog', doctrinalPurpose: 'Pre‑fabricated anti‑tank obstacle.', defaultRadius: 30 },
  OBBD: { code: 'OBBD', name: "Dragon's Teeth", family: 'barrier', description: 'Concrete anti-tank pyramids', doctrinalPurpose: 'Dense anti‑tank barrier.', defaultRadius: 60 },
  OBBB: { code: 'OBBB', name: 'Belgian Gate', family: 'barrier', description: 'Beach obstacle/gate', doctrinalPurpose: 'Anti‑landing obstacle.', defaultRadius: 40 },
  
  // Existing obstacles
  OBE: { code: 'OBE', name: 'Existing Obstacle', family: 'existing', description: 'Natural/cultural obstacle', doctrinalPurpose: 'Use terrain to impede enemy.', defaultRadius: 0 },
  OBES: { code: 'OBES', name: 'Steep Slope', family: 'existing', description: 'Impassable slope', doctrinalPurpose: 'Natural terrain barrier.', defaultRadius: 0 },
  OBER: { code: 'OBER', name: 'River/Lake', family: 'existing', description: 'Water obstacle', doctrinalPurpose: 'Water obstacle.', defaultRadius: 0 },
  OBEF: { code: 'OBEF', name: 'Forest', family: 'existing', description: 'Dense woods', doctrinalPurpose: 'Slows dismounted and mounted movement.', defaultRadius: 0 },
  OBEW: { code: 'OBEW', name: 'Wetland', family: 'existing', description: 'Swamp/marsh', doctrinalPurpose: 'Impedes movement.', defaultRadius: 0 },
  
  // Tactical effects
  OBT: { code: 'OBT', name: 'Turn Obstacle', family: 'effect', description: 'Obstacle to turn enemy', doctrinalPurpose: 'Force enemy into kill zone.', defaultRadius: 0 },
  OBD: { code: 'OBD', name: 'Disrupt Obstacle', family: 'effect', description: 'Obstacle to disrupt formation', doctrinalPurpose: 'Break up enemy formations.', defaultRadius: 0 },
  OBBLK: { code: 'OBBLK', name: 'Block Obstacle', family: 'effect', description: 'Complete block obstacle', doctrinalPurpose: 'Stop enemy advance.', defaultRadius: 0 },
  OBF: { code: 'OBF', name: 'Fix Obstacle', family: 'effect', description: 'Obstacle to fix enemy position', doctrinalPurpose: 'Pin enemy in place.', defaultRadius: 0 },
  OBCNL: { code: 'OBCNL', name: 'Canalize Obstacle', family: 'effect', description: 'Channelize enemy movement', doctrinalPurpose: 'Channel enemy into desired area.', defaultRadius: 0 },
};

export const OBSTACLE_FAMILIES: Record<ObstacleFamily, { name: string; icon: string }> = {
  wire: { name: 'Wire Obstacles', icon: '🔗' },
  minefield: { name: 'Minefields', icon: '💣' },
  barrier: { name: 'Barriers', icon: '🧱' },
  existing: { name: 'Existing/Natural', icon: '🌲' },
  effect: { name: 'Tactical Effects', icon: '🎯' },
};

export type ObstacleTypeCode = keyof typeof OBSTACLE_TYPES;

console.log('✅ obstacles.ts loaded, OBSTACLE_TYPES size:', Object.keys(OBSTACLE_TYPES).length);