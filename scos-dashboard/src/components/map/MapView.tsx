import React, {
  useEffect,
  forwardRef,
  useMemo,
  useCallback,
} from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Polyline,
  ImageOverlay,
  Polygon,
  Circle,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import * as mgrs from "mgrs";

import type { Obstacle } from "../../types";
import type { UnitMarker } from "../../types/units";

import {
  createObstacleSymbol,
  createUnitSymbol,
  fallbackSVG,
} from "../../utils/militarySymbols";

import { DrawControl } from "../DrawControl";
import { MapController } from "../MapController";
import { Legend } from "../Legend";

import type { MapControllerHandle } from "../MapController";


// -----------------------------------------------------
// Leaflet Default Marker Fix
// -----------------------------------------------------

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});


// -----------------------------------------------------
// TYPES
// -----------------------------------------------------

interface MapViewProps {
  obstacles: Obstacle[];
  units: UnitMarker[];

  onMapClick?: (lat: number, lng: number) => void;

  onDeleteObstacle?: (id: string) => void;
  onDeleteUnit?: (id: string) => void;

  losLine?: GeoJSON.Feature<GeoJSON.LineString> | null;
  losVisible?: boolean;

  drawingEnabled?: boolean;

  onAreaDrawn?: (area: GeoJSON.Polygon) => void;
  onPathDrawn?: (path: GeoJSON.LineString) => void;

  terrainImage?: string | null;

  terrainBounds?: [[number, number], [number, number]];

  showTerrain?: boolean;

  enemyMarker?: {
    position: [number, number];
    direction: number;
  } | null;

  enemyCorridor?: [number, number][] | null;

  objective?: [number, number] | null;

  plannedPath?: [number, number][] | null;

  selectedArea?: GeoJSON.Polygon | null;
}


// -----------------------------------------------------
// HELPERS
// -----------------------------------------------------

function getObstacleVisualType(
  typeCode: string
): "area" | "line" | "point" {

  if (typeCode.startsWith("OM")) return "area";

  if (typeCode === "OBBT") return "line";

  if (typeCode.startsWith("OBW")) return "line";

  return "point";
}


function createIcon(svg: string): L.DivIcon {

  return L.divIcon({
    html: `
      <div class="military-marker">
        ${svg}
      </div>
    `,
    className: "",
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24],
  });
}


function formatMGRS(lat: number, lng: number): string {

  try {
    return mgrs.forward([lng, lat]);
  } catch {
    return "Invalid MGRS";
  }
}


// -----------------------------------------------------
// MAP CLICK HANDLER
// -----------------------------------------------------

function MapClickHandler({
  onMapClick,
}: {
  onMapClick?: (lat: number, lng: number) => void;
}) {

  const map = useMap();

  useEffect(() => {

    if (!onMapClick) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };

    map.on("click", handleClick);

    return () => {
      map.off("click", handleClick);
    };

  }, [map, onMapClick]);

  return null;
}


// -----------------------------------------------------
// LAYER CONTROL
// -----------------------------------------------------

function LayerControl() {

  const map = useMap();

  useEffect(() => {

    const osm = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    );

    const satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    );

    satellite.addTo(map);

    const control = L.control.layers({
      Satellite: satellite,
      OpenStreetMap: osm,
    });

    control.addTo(map);

    return () => {
      map.removeControl(control);
    };

  }, [map]);

  return null;
}


// -----------------------------------------------------
// MAIN COMPONENT
// -----------------------------------------------------

export const MapView = forwardRef<
  MapControllerHandle,
  MapViewProps
>((props, ref) => {

  const {
    obstacles,
    units,

    onMapClick,

    onDeleteObstacle,
    onDeleteUnit,

    losLine,
    losVisible,

    drawingEnabled,

    onAreaDrawn,
    onPathDrawn,

    terrainImage,
    terrainBounds,
    showTerrain,

    enemyMarker,
    enemyCorridor,

    objective,
    plannedPath,

    selectedArea,
  } = props;


  // ---------------------------------------------------
  // ICONS
  // ---------------------------------------------------

  const obstacleIcons = useMemo(() => {

    return obstacles.map((obs) => {

      const svg =
        createObstacleSymbol(obs.typeCode) ||
        fallbackSVG(obs.typeCode);

      return createIcon(svg);

    });

  }, [obstacles]);


  const unitIcons = useMemo(() => {

    return units.map((unit) => {

      const svg =
        createUnitSymbol(
          unit.typeCode,
          unit.affiliation,
          unit.echelon,
          unit.modifiers
        ) || fallbackSVG(unit.typeCode);

      return createIcon(svg);

    });

  }, [units]);


  // ---------------------------------------------------
  // SELECTED AREA
  // ---------------------------------------------------

  const selectedPolygon = useMemo(() => {

    if (!selectedArea) return [];

    return selectedArea.coordinates[0].map(
      (coord) => [coord[1], coord[0]] as [number, number]
    );

  }, [selectedArea]);


  // ---------------------------------------------------
  // DELETE HANDLERS
  // ---------------------------------------------------

  const handleDeleteObstacle = useCallback(
    (id: string) => {
      onDeleteObstacle?.(id);
    },
    [onDeleteObstacle]
  );

  const handleDeleteUnit = useCallback(
    (id: string) => {
      onDeleteUnit?.(id);
    },
    [onDeleteUnit]
  );


  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------

  return (

    <MapContainer
      center={[51.505, -0.09]}
      zoom={13}
      style={{
        height: "100%",
        width: "100%",
      }}
    >

      <MapController ref={ref} />

      <LayerControl />

      {!drawingEnabled && (
        <MapClickHandler onMapClick={onMapClick} />
      )}

      <Legend />

      <TileLayer
        attribution="OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />



      {/* Terrain Overlay */}

      {showTerrain &&
        terrainImage &&
        terrainBounds && (

          <ImageOverlay
            url={terrainImage}
            bounds={terrainBounds}
            opacity={0.6}
          />
      )}



      {/* Selected Area */}

      {selectedArea && (
        <Polygon
          positions={selectedPolygon}
          pathOptions={{
            color: "#00ff00",
            weight: 2,
            fillOpacity: 0.05,
          }}
        />
      )}



      {/* Enemy Corridor */}

      {enemyCorridor &&
        enemyCorridor.length >= 3 && (

          <Polygon
            positions={enemyCorridor}
            pathOptions={{
              color: "#ff6600",
              weight: 2,
              fillColor: "#ff6600",
              fillOpacity: 0.12,
            }}
          />
      )}



      {/* Planned Path */}

      {plannedPath &&
        plannedPath.length > 1 && (

          <Polyline
            positions={plannedPath}
            color="cyan"
            weight={3}
            dashArray="6,6"
          />
      )}



      {/* LOS */}

      {losLine && (
        <Polyline
          positions={
            losLine.geometry.coordinates.map(
              ([lng, lat]): [number, number] => [lat, lng]
            ) as [number, number][]
          }
          color={losVisible ? "lime" : "red"}
          weight={4}
        />
      )}



      {/* Objective */}

      {objective && (
        <Marker position={objective}>
          <Popup>Objective</Popup>
        </Marker>
      )}



      {/* Enemy Marker */}

      {enemyMarker && (
        <Marker
          position={enemyMarker.position}
          icon={L.divIcon({
            html: `
              <div
                style="
                  width:40px;
                  height:40px;
                  background:red;
                  clip-path: polygon(
                    50% 0%,
                    0% 100%,
                    100% 100%
                  );
                  transform: rotate(${enemyMarker.direction}deg);
                "
              />
            `,
            className: "",
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          })}
        >
          <Popup>Enemy Unit</Popup>
        </Marker>
      )}



      {/* Obstacles */}

      {obstacles.map((obs, index) => {

        const icon = obstacleIcons[index];

        const visualType =
          getObstacleVisualType(obs.typeCode);

        return (

          <React.Fragment key={obs.id}>

            {visualType === "area" && (
              <Circle
                center={[obs.lat, obs.lng]}
                radius={obs.radius}
                pathOptions={{
                  color: "#8B0000",
                  fillColor: "#ff0000",
                  fillOpacity: 0.2,
                }}
              />
            )}


            <Marker
              position={[obs.lat, obs.lng]}
              icon={icon}
              draggable
            >

              <Popup>

                <strong>
                  {obs.typeName || obs.typeCode}
                </strong>

                <br />

                {formatMGRS(obs.lat, obs.lng)}

                <br />

                Radius: {obs.radius}m

                <br /><br />

                <button
                  className="deleteMarker"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteObstacle(obs.id);
                  }}
                >
                  Delete
                </button>

              </Popup>

            </Marker>

          </React.Fragment>
        );

      })}



      {/* Units */}

      {units.map((unit, index) => {

        const icon = unitIcons[index];

        return (

          <Marker
            key={unit.id}
            position={[unit.lat, unit.lng]}
            icon={icon}
            draggable
          >

            <Popup>

              <strong>
                {unit.name || unit.typeCode}
              </strong>

              <br />

              {formatMGRS(unit.lat, unit.lng)}

              <br />

              {unit.affiliation}

              <br /><br />

              <button
                className="deleteMarker"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteUnit(unit.id);
                }}
              >
                Delete
              </button>

            </Popup>

          </Marker>
        );

      })}



      {/* Draw Control */}

      {drawingEnabled && (
        <DrawControl
          enabled={drawingEnabled}
          onAreaCreated={onAreaDrawn}
          onPathCreated={onPathDrawn}
        />
      )}

    </MapContainer>
  );
});
