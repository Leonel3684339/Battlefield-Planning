import JSZip from 'jszip';
import { generateKML } from './exportKML';
import type { Obstacle } from '../types';
import type { UnitMarker } from '../types/units';

export async function generateKMZ(obstacles: Obstacle[], units: UnitMarker[]): Promise<Blob> {
  // Generate KML content using your existing function
  const kmlContent = generateKML(obstacles, units);
  
  // Create a ZIP archive
  const zip = new JSZip();
  zip.file("doc.kml", kmlContent);
  
  // Generate the KMZ blob
  const kmzBlob = await zip.generateAsync({ type: "blob" });
  return kmzBlob;
}