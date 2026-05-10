import React, { useEffect, useMemo, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
import { MapData } from '../types';

type LatLng = [number, number];

interface DecisionMapProps {
  data: MapData;
}

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function FitBounds({ route }: { route: LatLng[] }) {
  const map = useMap();

  useEffect(() => {
    if (route.length > 0) {
      map.fitBounds(route, { padding: [40, 40] });
    }
  }, [route, map]);

  return null;
}

async function geocodeLocation(place: string): Promise<LatLng | null> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      place
    )}&limit=1`
  );

  const results = await response.json();

  if (!results?.[0]) return null;

  return [parseFloat(results[0].lat), parseFloat(results[0].lon)];
}

async function fetchRoute(
  origin: LatLng,
  destination: LatLng,
  travelMode: string
): Promise<LatLng[]> {
  const profile =
    travelMode === 'WALKING'
      ? 'foot'
      : travelMode === 'BICYCLING'
      ? 'bike'
      : 'driving';

  const [originLat, originLng] = origin;
  const [destinationLat, destinationLng] = destination;

  const response = await fetch(
    `https://router.project-osrm.org/route/v1/${profile}/${originLng},${originLat};${destinationLng},${destinationLat}?overview=full&geometries=geojson`
  );

  const data = await response.json();

  const coordinates = data?.routes?.[0]?.geometry?.coordinates || [];

  return coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
}

export default function DecisionMap({ data }: DecisionMapProps) {
  const [originCoords, setOriginCoords] = useState<LatLng | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<LatLng | null>(null);
  const [route, setRoute] = useState<LatLng[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadMapData() {
      try {
        setLoading(true);

        const origin = await geocodeLocation(data.origin);
        const destination = await geocodeLocation(data.destination);

        if (!active) return;

        setOriginCoords(origin);
        setDestinationCoords(destination);

        if (origin && destination) {
          const routeCoords = await fetchRoute(
            origin,
            destination,
            data.travelMode
          );

          if (active) setRoute(routeCoords);
        }
      } catch (error) {
        console.error('OpenStreetMap route failed:', error);
      } finally {
        if (active) setLoading(false);
      }
    }

    if (data.origin && data.destination) {
      loadMapData();
    }

    return () => {
      active = false;
    };
  }, [data.origin, data.destination, data.travelMode]);

  const center = useMemo<LatLng>(() => {
    return originCoords || destinationCoords || [30.2672, -97.7431];
  }, [originCoords, destinationCoords]);

  return (
    <div className="w-full h-[400px] rounded-3xl overflow-hidden border border-border-light shadow-sm bg-gray-50 relative">
      {loading && (
        <div className="absolute inset-0 z-[999] bg-white/70 backdrop-blur-sm flex items-center justify-center text-xs font-bold uppercase tracking-widest text-gray-400">
          Loading route...
        </div>
      )}

      <MapContainer
        center={center}
        zoom={10}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {originCoords && (
          <Marker position={originCoords} icon={markerIcon}>
            <Popup>Origin: {data.origin}</Popup>
          </Marker>
        )}

        {destinationCoords && (
          <Marker position={destinationCoords} icon={markerIcon}>
            <Popup>Destination: {data.destination}</Popup>
          </Marker>
        )}

        {route.length > 0 && (
          <>
            <Polyline positions={route} />
            <FitBounds route={route} />
          </>
        )}
      </MapContainer>

      <div className="absolute top-4 left-4 z-[999] p-4 bg-white/90 backdrop-blur shadow-md rounded-2xl border border-gray-100 max-w-[240px]">
        <p className="text-[10px] font-black uppercase text-brand-sage mb-2 tracking-widest">
          Spatial Intelligence
        </p>

        <div className="space-y-3">
          <div>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">
              Origin
            </p>
            <p className="text-[10px] font-medium text-[#4A4A4A] truncate">
              {data.origin}
            </p>
          </div>

          <div className="w-px h-3 bg-gray-100 ml-1" />

          <div>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">
              Destination
            </p>
            <p className="text-[10px] font-medium text-[#4A4A4A] truncate">
              {data.destination}
            </p>
          </div>
        </div>

        {data.description && (
          <p className="mt-3 pt-3 border-t border-gray-50 text-[9px] text-gray-500 italic">
            "{data.description}"
          </p>
        )}

        <div className="mt-3 flex items-center gap-1 text-[8px] text-gray-400">
          <MapPin className="w-3 h-3" />
          OpenStreetMap + Leaflet
        </div>
      </div>
    </div>
  );
}