import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Bus, Clock, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const busIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function TrackBus() {
  const [selectedBusId, setSelectedBusId] = useState('all');

  const { data: buses = [] } = useQuery({ 
    queryKey: ['buses'], 
    queryFn: () => base44.entities.Bus.list(),
    refetchInterval: 10000,
  });

  const { data: routes = [] } = useQuery({ queryKey: ['routes'], queryFn: () => base44.entities.Route.list() });

  const trackableBuses = buses.filter(b => b.current_latitude && b.current_longitude);
  const displayBuses = selectedBusId === 'all' ? trackableBuses : trackableBuses.filter(b => b.id === selectedBusId);

  // Default center: Thohoyandou, Limpopo
  const center = displayBuses.length > 0 
    ? [displayBuses[0].current_latitude, displayBuses[0].current_longitude]
    : [-23.0, 30.45];

  return (
    <div>
      <PageHeader title="Track Bus" description="See live bus locations on the map" />

      <div className="mb-4 max-w-xs">
        <Select value={selectedBusId} onValueChange={setSelectedBusId}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by bus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Buses</SelectItem>
            {buses.map(b => <SelectItem key={b.id} value={b.id}>{b.bus_number} — {b.assigned_route_name || 'No route'}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="h-[500px] relative">
            <MapContainer center={center} zoom={10} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
              {displayBuses.map(bus => (
                <Marker key={bus.id} position={[bus.current_latitude, bus.current_longitude]} icon={busIcon}>
                  <Popup>
                    <div className="text-sm space-y-1">
                      <p className="font-bold">{bus.bus_number}</p>
                      <p>{bus.assigned_route_name || 'No route'}</p>
                      <p>Driver: {bus.assigned_driver_name || 'Unassigned'}</p>
                      <p>Status: {bus.status}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {trackableBuses.length === 0 && (
        <div className="text-center py-8 text-muted-foreground mt-4">
          <MapPin className="w-8 h-8 mx-auto mb-2" />
          <p>No buses are currently broadcasting their location.</p>
        </div>
      )}

      {/* Bus list below map */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
        {buses.map(b => {
          const route = routes.find(r => r.id === b.assigned_route_id);
          return (
            <Card key={b.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedBusId(b.id)}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><Bus className="w-4 h-4 text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{b.bus_number}</p>
                  <p className="text-xs text-muted-foreground truncate">{route?.route_name || 'No route'}</p>
                </div>
                <StatusBadge status={b.status} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
