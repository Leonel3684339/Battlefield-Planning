import type { Obstacle } from '../types';
import type { UnitMarker } from '../types/units';
import * as mgrs from 'mgrs';

function escapeXML(text: string): string {
  return text.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;')
             .replace(/"/g, '&quot;')
             .replace(/'/g, '&apos;');
}

function getMGRS(lat: number, lng: number): string {
  try {
    return mgrs.forward([lng, lat]);
  } catch {
    return 'Invalid coordinates';
  }
}

function kmlPlacemarkWithDetails(
  name: string,
  category: string,
  lat: number,
  lng: number,
  extraFields: Record<string, string>
): string {
  const mgrsStr = getMGRS(lat, lng);
  let description = `<![CDATA[<table border="0" cellpadding="2">`;
  description += `<tr><td><b>Type:</b></td><td>${escapeXML(category)}</td></tr>`;
  description += `<tr><td><b>MGRS:</b></td><td>${escapeXML(mgrsStr)}</td></tr>`;
  description += `<tr><td><b>Latitude:</b></td><td>${lat.toFixed(6)}</td></tr>`;
  description += `<tr><td><b>Longitude:</b></td><td>${lng.toFixed(6)}</td></tr>`;
  for (const [key, value] of Object.entries(extraFields)) {
    description += `<tr><td><b>${escapeXML(key)}:</b></td><td>${escapeXML(value)}</td></tr>`;
  }
  description += `</table>]]>`;
  
  // Choose icon colour based on category
  const iconColor = category === 'Obstacle' ? 'red' : 'blue';
  const iconHref = `http://maps.google.com/mapfiles/kml/pushpin/${iconColor}-pushpin.png`;
  
  return `
  <Placemark>
    <name>${escapeXML(name)}</name>
    <description>${description}</description>
    <Style>
      <IconStyle>
        <scale>1.0</scale>
        <Icon>
          <href>${iconHref}</href>
        </Icon>
      </IconStyle>
    </Style>
    <Point>
      <coordinates>${lng},${lat},0</coordinates>
    </Point>
  </Placemark>`;
}

export function generateKML(obstacles: Obstacle[], units: UnitMarker[]): string {
  let placemarks = '';

  obstacles.forEach(obs => {
    const name = obs.typeName || obs.typeCode;
    placemarks += kmlPlacemarkWithDetails(
      name,
      'Obstacle',
      obs.lat,
      obs.lng,
      {
        'Radius (m)': obs.radius.toString(),
        'Type Code': obs.typeCode
      }
    );
  });

  units.forEach(unit => {
    const name = unit.name || unit.typeCode;
    const details: Record<string, string> = {
      'Affiliation': unit.affiliation
    };
    if (unit.echelon && unit.echelon !== 'none') details['Echelon'] = unit.echelon;
    if (unit.modifiers?.headquarters) details['Headquarters'] = 'Yes';
    if (unit.modifiers?.taskForce) details['Task Force'] = 'Yes';
    placemarks += kmlPlacemarkWithDetails(
      name,
      'Unit',
      unit.lat,
      unit.lng,
      details
    );
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Tactical Plan</name>
    ${placemarks}
  </Document>
</kml>`;
}