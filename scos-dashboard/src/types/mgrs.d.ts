declare module 'mgrs' {
  export function toPoint(mgrsCoord: string): [number, number] | null;
}