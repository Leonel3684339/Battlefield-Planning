import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';

interface DrawControlProps {
  onAreaCreated?: (area: GeoJSON.Polygon) => void;
  onPathCreated?: (path: GeoJSON.LineString) => void;
  enabled: boolean;
}

export function DrawControl({ onAreaCreated, onPathCreated, enabled }: DrawControlProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const DrawControl = (L.Control as any).Draw;
    const drawControl = new DrawControl({
      draw: {
        polygon: enabled,
        rectangle: enabled,
        polyline: enabled,
        circle: false,
        marker: false,
        circlemarker: false,
      },
      edit: false,
    });

    const handleDrawCreated = (e: any) => {
      const layer = e.layer;
      const geoJSON = layer.toGeoJSON();
      if (geoJSON.geometry.type === 'Polygon' && onAreaCreated) {
        onAreaCreated(geoJSON.geometry);
      } else if (geoJSON.geometry.type === 'LineString' && onPathCreated) {
        onPathCreated(geoJSON.geometry);
      }
    };

    if (enabled) {
      map.addControl(drawControl);
      map.on(L.Draw.Event.CREATED, handleDrawCreated);
    }

    return () => {
      if (enabled) {
        map.off(L.Draw.Event.CREATED, handleDrawCreated);
        map.removeControl(drawControl);
      }
    };
  }, [map, enabled, onAreaCreated, onPathCreated]);

  return null;
}