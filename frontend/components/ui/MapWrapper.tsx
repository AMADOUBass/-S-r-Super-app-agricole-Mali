'use client';

// Ce composant enveloppe React-Leaflet via un import dynamique (Lazy Loading)
// Indispensable dans Next.js pour éviter l'erreur "window is not defined" au SSR
// et pour réduire drastiquement la taille du bundle initial.

import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo } from 'react';

// On importe le vrai composant de carte de manière asynchrone
const MapContainer = dynamic(
  () => import('react-leaflet').then(mod => mod.MapContainer),
  { 
    ssr: false, 
    loading: () => (
      <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center rounded-2xl">
        <span className="text-sm font-medium text-slate-400">Chargement de la carte...</span>
      </div>
    ) 
  }
);

const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

export interface MapMarker {
  id: string;
  position: [number, number];
  label: string;
  price?: number;
  type?: string;
}

// Composant interne pour gérer les changements de vue dynamiques
function MapController({ center, markers }: { center: [number, number], markers: MapMarker[] }) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useMap: useLeafletMap } = require('react-leaflet');
  const map = useLeafletMap();

  useEffect(() => {
    if (markers.length === 1) {
      map.setView(markers[0].position, 10);
    } else if (markers.length > 1) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const L = require('leaflet');
      const bounds = L.latLngBounds(markers.map(m => m.position));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
    } else {
      map.setView(center, 6);
    }
  }, [markers, center, map]);

  return null;
}

export function MapWrapper({ 
  center = [12.6392, -8.0029], 
  zoom = 6,
  markers = []
}: { 
  center?: [number, number], 
  zoom?: number,
  markers?: MapMarker[]
}) {
  
  useEffect(() => {
    // Correctif Leaflet pour les icônes par défaut dans Next.js
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const L = require('leaflet');
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-border shadow-inner">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <MapController center={center} markers={markers} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {markers.map((m) => (
          <Marker key={m.id} position={m.position}>
            <Popup>
              <div className="p-1">
                <p className="font-bold text-sm m-0">{m.label}</p>
                {m.price && <p className="text-primary-700 font-black m-0">{m.price.toLocaleString('fr')} FCFA</p>}
                {m.type && <p className="text-[10px] text-muted-fg uppercase m-0 mt-1">{m.type}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
        {markers.length === 0 && <Marker position={center} />}
      </MapContainer>
    </div>
  );
}
