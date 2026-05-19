import { forwardRef, useImperativeHandle } from 'react';
import { useMap } from 'react-leaflet';

export interface MapControllerHandle {
  flyToBounds: (bounds: [[number, number], [number, number]]) => void;
}

export const MapController = forwardRef<MapControllerHandle>((_, ref) => {
  const map = useMap();

  useImperativeHandle(ref, () => ({
    flyToBounds: (bounds: [[number, number], [number, number]]) => {
      map.flyToBounds(bounds, { duration: 1.5 });
    },
  }));

  return null;
});