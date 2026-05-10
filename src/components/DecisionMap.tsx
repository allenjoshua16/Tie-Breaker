import React, { useEffect, useRef } from 'react';
import { Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { AlertCircle, MapPin } from 'lucide-react';
import { MapData } from '../types';

const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(GOOGLE_MAPS_KEY) && GOOGLE_MAPS_KEY !== 'YOUR_API_KEY';

interface DecisionMapProps {
  data: MapData;
}

function RouteDisplay({ origin, destination, travelMode }: {
  origin: string;
  destination: string;
  travelMode: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!routesLib || !map || !origin || !destination) return;
    
    // Clear previous route
    polylinesRef.current.forEach(p => p.setMap(null));

    routesLib.Route.computeRoutes({
      origin,
      destination,
      travelMode: travelMode as any,
      fields: ['path', 'viewport'],
    }).then(({ routes }) => {
      if (routes?.[0]) {
        const newPolylines = routes[0].createPolylines();
        newPolylines.forEach(p => p.setMap(map));
        polylinesRef.current = newPolylines;
        if (routes[0].viewport) map.fitBounds(routes[0].viewport);
      }
    }).catch(err => {
      console.error("Route computation failed:", err);
    });

    return () => polylinesRef.current.forEach(p => p.setMap(null));
  }, [routesLib, map, origin, destination, travelMode]);

  return null;
}

export default function DecisionMap({ data }: DecisionMapProps) {
  if (!hasValidKey) {
    return (
      <div className="w-full h-[400px] rounded-3xl overflow-hidden border border-border-light shadow-sm bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
            <MapPin className="w-6 h-6 text-gray-300" />
         </div>
         <h4 className="text-sm font-black uppercase tracking-widest text-[#4A4A4A] mb-2">Maps Integration Available</h4>
         <p className="text-[10px] text-gray-400 font-medium max-w-[280px] leading-relaxed">
           To enable spatial intelligence and routing, add a <strong>GOOGLE_MAPS_PLATFORM_KEY</strong> to your environment secrets.
         </p>
         <div className="mt-6 p-4 bg-white rounded-2xl border border-gray-100 flex flex-col items-start text-left max-w-[320px]">
            <div className="flex items-center gap-2 mb-2">
               <AlertCircle className="w-3 h-3 text-brand-gold" />
               <p className="text-[9px] font-black uppercase text-brand-gold">Setup Required</p>
            </div>
            <ol className="text-[9px] text-gray-500 space-y-1 ml-4 list-decimal font-medium">
               <li>Get an API key from Google Cloud Console</li>
               <li>Open Settings → Secrets in AI Studio</li>
               <li>Add GOOGLE_MAPS_PLATFORM_KEY</li>
            </ol>
         </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] rounded-3xl overflow-hidden border border-border-light shadow-sm bg-gray-50 relative">
      <Map
        defaultCenter={{ lat: 0, lng: 0 }}
        defaultZoom={3}
        mapId="DECISION_INTELLIGENCE_MAP"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
        disableDefaultUI={true}
        gestureHandling={'greedy'}
      >
        <RouteDisplay 
          origin={data.origin} 
          destination={data.destination} 
          travelMode={data.travelMode} 
        />
      </Map>
      
      {/* Map Overlay Info */}
      <div className="absolute top-4 left-4 p-4 bg-white/90 backdrop-blur shadow-md rounded-2xl border border-gray-100 max-w-[240px]">
        <p className="text-[10px] font-black uppercase text-brand-sage mb-2 tracking-widest">Spatial Intelligence</p>
        <div className="space-y-3">
          <div>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Origin</p>
            <p className="text-[10px] font-medium text-[#4A4A4A] truncate">{data.origin}</p>
          </div>
          <div className="w-px h-3 bg-gray-100 ml-1" />
          <div>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Destination</p>
            <p className="text-[10px] font-medium text-[#4A4A4A] truncate">{data.destination}</p>
          </div>
        </div>
        {data.description && (
          <p className="mt-3 pt-3 border-t border-gray-50 text-[9px] text-gray-500 italic">
            "{data.description}"
          </p>
        )}
      </div>
    </div>
  );
}
