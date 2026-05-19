import type { ObstacleTypeCode } from './obstacles';

export type ModelType = 'poisson' | 'strauss';

export interface Obstacle {
  id: string;
  lat: number;
  lng: number;
  radius: number;       // in meters
  typeCode: ObstacleTypeCode;  // MIL-STD-2525 code
  // Optional metadata for display
  typeName?: string;    // resolved from typeCode for convenience
}