import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bus, MapPin } from 'lucide-react';

// Fix default leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const busIcon = new L.DivIcon({
  className: '',
  html: `<div style="
    background: #2d7a47;
    border: 3px solid white;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    font-size: 18px;
  ">🚌</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const stopIcon = new L.DivIcon({
  className: '',
  html: `<div style="
    background: #f59e0b;
    border: 2px solid white;
    border-radius: 50%;
    width: 14px;
    height: 14px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

// Recenter map when bus position changes
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom, { animate: true });
  }, [center?.[0], center?.[1]]);
  return null;
}

export default function LiveBusMap({ bus, route }) {
  const hasPosition = bus?.current_latitude && bus?.current_longitude;
  const stops = route?.stops || [];
  const sortedStops = [...stops].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const stopPositions = sortedStops
    .filter(s => s.latitude && s.longitude)
    .map(s => [s.latitude, s.longitude]);

  const busPosition = hasPosition ? [bus.current_latitude, bus.current_longitude] : null;

  // Default center: Limpopo region
  const defaultCenter = [-23.0, 30.45];
  const mapCenter = busPosition || (stopPositions.length > 0 ? stopPositions[0] : defaultCenter);

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={mapCenter}
        zoom={busPosition ? 13 : 10}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <MapController center={busPosition || mapCenter} zoom={busPosition ? 13 : 10} />

        {/* Route polyline through stops */}
        {stopPositions.length > 1 && (
          <Polyline
            positions={stopPositions}
            color="#2d7a47"
            weight={4}
            opacity={0.6}
            dashArray="8 4"
          />
        )}

        {/* Stop markers */}
        {sortedStops.filter(s => s.latitude && s.longitude).map((stop, i) => (
          <Marker key={i} position={[stop.latitude, stop.longitude]} icon={stopIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{stop.name}</p>
                <p className="text-gray-500 text-xs">Stop {stop.order ?? i + 1}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Live bus marker */}
        {busPosition && (
          <Marker position={busPosition} icon={busIcon}>
            <Popup>
              <div className="text-sm space-y-1 min-w-[140px]">
                <p className="font-bold text-base">{bus.bus_number}</p>
                <p className="text-gray-600">{bus.assigned_route_name || route?.route_name || 'No route'}</p>
                <p className="text-gray-500">Driver: {bus.assigned_driver_name || 'Unassigned'}</p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                  bus.status === 'Active' ? 'bg-green-100 text-green-700' :
                  bus.status === 'Delayed' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-600'
                }`}>{bus.status}</span>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {!hasPosition && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[500]">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl px-6 py-4 shadow-lg text-center">
            <div className="text-3xl mb-2">📡</div>
            <p className="font-semibold text-gray-700 text-sm">No live location yet</p>
            <p className="text-gray-500 text-xs mt-1">Bus hasn't broadcast its position</p>
          </div>
        </div>
      )}
    </div>
  );
}
