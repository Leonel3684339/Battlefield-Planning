import { useState } from 'react';
import axios from 'axios';
import { toPoint } from 'mgrs';

interface LocationSelectorProps {
  onAreaSelected: (area: GeoJSON.Polygon | null) => void;
  onDrawingMode: (active: boolean) => void;
  isDrawing: boolean;
}

export function LocationSelector({ onAreaSelected, onDrawingMode, isDrawing }: LocationSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [mgrsInput, setMgrsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State for MGRS polygon points
  const [mgrsPoints, setMgrsPoints] = useState<string[]>([]);
  const [newMgrsPoint, setNewMgrsPoint] = useState('');

  // Place search (unchanged)
  const handlePlaceSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: { q: searchQuery, format: 'json', limit: 1 },
      });
      if (response.data && response.data.length > 0) {
        const { boundingbox } = response.data[0];
        const [south, north, west, east] = boundingbox.map(Number);
        const polygon: GeoJSON.Polygon = {
          type: 'Polygon',
          coordinates: [[
            [west, south],
            [east, south],
            [east, north],
            [west, north],
            [west, south],
          ]],
        };
        onAreaSelected(polygon);
      } else {
        setError('Location not found');
      }
    } catch (err) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  // Single MGRS search (point with buffer)
  const handleMGRSSubmit = () => {
    try {
      const latLon = toPoint(mgrsInput);
      if (latLon) {
        const [lon, lat] = latLon;
        const delta = 0.01; // ~1km buffer
        const polygon: GeoJSON.Polygon = {
          type: 'Polygon',
          coordinates: [[
            [lon - delta, lat - delta],
            [lon + delta, lat - delta],
            [lon + delta, lat + delta],
            [lon - delta, lat + delta],
            [lon - delta, lat - delta],
          ]],
        };
        onAreaSelected(polygon);
        setError('');
      } else {
        setError('Invalid MGRS');
      }
    } catch (err) {
      setError('Invalid MGRS format');
    }
  };

  // Add MGRS point to polygon list
  const addMgrsPoint = () => {
    if (!newMgrsPoint.trim()) {
      setError('Please enter an MGRS coordinate');
      return;
    }
    // Validate MGRS
    try {
      const latLon = toPoint(newMgrsPoint);
      if (!latLon) throw new Error('Invalid MGRS');
      setMgrsPoints([...mgrsPoints, newMgrsPoint]);
      setNewMgrsPoint('');
      setError('');
    } catch (err) {
      setError('Invalid MGRS coordinate');
    }
  };

  // Remove point
  const removeMgrsPoint = (index: number) => {
    setMgrsPoints(mgrsPoints.filter((_, i) => i !== index));
  };

  // Create polygon from MGRS points
  const createPolygonFromMgrsPoints = () => {
    if (mgrsPoints.length < 3) {
      setError('At least 3 MGRS points are required to form a polygon');
      return;
    }
    try {
      const coordinates: [number, number][] = mgrsPoints.map(mgrsStr => {
        const latLon = toPoint(mgrsStr);
        if (!latLon) throw new Error(`Invalid MGRS: ${mgrsStr}`);
        const [lon, lat] = latLon;
        return [lon, lat];
      });
      // Close polygon
      coordinates.push(coordinates[0]);
      const polygon: GeoJSON.Polygon = {
        type: 'Polygon',
        coordinates: [coordinates],
      };
      onAreaSelected(polygon);
      setError('');
    } catch (err) {
      setError('Failed to create polygon: ' + (err as Error).message);

    }
  };

  // Clear all MGRS points
  const clearMgrsPoints = () => {
    setMgrsPoints([]);
  };

  return (
    <div className="p-4 bg-[rgb(63,79,63)] backdrop-blur-md rounded-lg border border-[rgb(90,90,62)] space-y-3">
      <h3 className="font-semibold text-[rgb(224,224,192)]">Select Area</h3>
      
      {/* Place name search */}
      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="Place name (e.g., Berlin)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border border-[rgb(90,90,62)] bg-[rgb(46,59,46)] text-[rgb(224,224,192)] focus:outline-none focus:border-[rgb(139,125,107)]"
        />
        <button
          onClick={handlePlaceSearch}
          disabled={loading}
          className="px-4 py-2 bg-[rgb(75,83,32)] text-[rgb(224,224,192)] rounded-lg hover:bg-[rgb(58,64,24)] disabled:opacity-50 transition"
        >
          {loading ? '...' : 'Search'}
        </button>
      </div>

      {/* Single MGRS (point with buffer) */}
      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="MGRS (e.g., 33UXP1234567890)"
          value={mgrsInput}
          onChange={(e) => setMgrsInput(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border border-[rgb(90,90,62)] bg-[rgb(46,59,46)] text-[rgb(224,224,192)] focus:outline-none focus:border-[rgb(139,125,107)]"
        />
        <button
          onClick={handleMGRSSubmit}
          className="px-4 py-2 bg-[rgb(75,83,32)] text-[rgb(224,224,192)] rounded-lg hover:bg-[rgb(58,64,24)] transition"
        >
          Go
        </button>
      </div>

      {/* Draw on map button */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onDrawingMode(!isDrawing)}
          className={`flex-1 px-4 py-2 rounded-lg transition ${
            isDrawing
              ? 'bg-[rgb(107,79,60)] hover:bg-[rgb(79,58,43)] text-[rgb(224,224,192)]'
              : 'bg-[rgb(46,59,46)] text-[rgb(176,160,128)] hover:bg-[rgb(75,83,32)] hover:text-[rgb(224,224,192)]'
          }`}
        >
          {isDrawing ?  'Drawing Active' : 'Draw on Map'}
        </button>
      </div>

      {/* Polygon by MGRS coordinates */}
      <div className="border-t border-[rgb(90,90,62)] pt-3">
        <h4 className="text-sm font-semibold text-[rgb(224,224,192)] mb-2">Polygon by MGRS Points</h4>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            placeholder="MGRS (e.g., 33UXP1234567890)"
            value={newMgrsPoint}
            onChange={(e) => setNewMgrsPoint(e.target.value.toUpperCase())}
            className="flex-1 px-2 py-1 rounded border border-[rgb(90,90,62)] bg-[rgb(46,59,46)] text-[rgb(224,224,192)] text-sm"
          />
          <button
            onClick={addMgrsPoint}
            className="px-3 py-1 bg-[rgb(75,83,32)] text-[rgb(224,224,192)] rounded hover:bg-[rgb(58,64,24)] text-sm"
          >
            Add
          </button>
        </div>
        {mgrsPoints.length > 0 && (
          <div className="mb-2">
            <div className="text-xs text-[hsl(40,23%,60%)] mb-1">Points:</div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {mgrsPoints.map((pt, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="text-[rgb(224,224,192)] font-mono">{pt}</span>
                  <button
                    onClick={() => removeMgrsPoint(idx)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="flex space-x-2 mt-2">
              <button
                onClick={createPolygonFromMgrsPoints}
                className="flex-1 px-3 py-1 bg-[rgb(75,83,32)] text-[rgb(224,224,192)] rounded hover:bg-[rgb(58,64,24)] text-sm"
              >
                Create Polygon
              </button>
              <button
                onClick={clearMgrsPoints}
                className="px-3 py-1 bg-[rgb(46,59,46)] text-[rgb(176,160,128)] rounded hover:bg-[rgb(75,83,32)] text-sm"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-[rgb(139,58,58)]">{error}</p>}
    </div>
  );
}
