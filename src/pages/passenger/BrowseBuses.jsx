import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOutletContext } from 'react-router-dom';
import { Bus, MapPin, Clock, Search, Ticket, Radio } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import LiveBusMap from '@/components/passenger/LiveBusMap';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function BrowseBuses() {
  const { user } = useOutletContext();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [trackedSchedule, setTrackedSchedule] = useState(null);

  const { data: schedules = [] } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => base44.entities.Schedule.list('-date'),
  });
  const { data: buses = [], dataUpdatedAt } = useQuery({
    queryKey: ['buses'],
    queryFn: () => base44.entities.Bus.list(),
    refetchInterval: 5000,
  });
  const { data: routes = [] } = useQuery({
    queryKey: ['routes'],
    queryFn: () => base44.entities.Route.list(),
  });

  const bookMutation = useMutation({
    mutationFn: (data) => base44.entities.Ticket.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      setBookingOpen(false);
      toast.success('Ticket booked successfully!');
    },
  });

  const enrichedSchedules = schedules.map(s => {
    const bus = buses.find(b => b.id === s.bus_id);
    const route = routes.find(r => r.id === s.route_id);
    return { ...s, bus, route };
  });

  const filtered = enrichedSchedules.filter(s => {
    const q = search.toLowerCase();
    return !q ||
      s.route?.route_name?.toLowerCase().includes(q) ||
      s.bus?.bus_number?.toLowerCase().includes(q) ||
      s.route?.origin?.toLowerCase().includes(q) ||
      s.route?.destination?.toLowerCase().includes(q);
  });

  const handleBook = (schedule) => { setSelectedSchedule(schedule); setBookingOpen(true); };
  const handleTrack = (schedule) => {
    setTrackedSchedule(prev => prev?.id === schedule.id ? null : schedule);
  };

  const confirmBook = () => {
    const s = selectedSchedule;
    bookMutation.mutate({
      passenger_email: user?.email || user?.username || '',
      passenger_name: user?.full_name || user?.username || '',
      schedule_id: s.id,
      bus_id: s.bus_id,
      bus_number: s.bus_number || s.bus?.bus_number || '',
      route_id: s.route_id,
      route_name: s.route_name || s.route?.route_name || '',
      travel_date: s.date,
      departure_time: s.departure_time,
      fare: s.route?.fare || 0,
      status: 'Booked',
      seat_number: Math.floor(Math.random() * (s.bus?.capacity || 40)) + 1,
    });
  };

  // Resolve live bus for tracked schedule
  const trackedBus = trackedSchedule
    ? buses.find(b => b.id === trackedSchedule.bus_id)
    : null;
  const trackedRoute = trackedSchedule?.route || null;

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  return (
    <div>
      <PageHeader title="Browse Buses" description="Find, book, and track your next trip in real time" />

      {/* Live Tracking Panel */}
      {trackedSchedule && (
        <Card className="mb-6 overflow-hidden border-primary/30 shadow-md">
          <CardHeader className="pb-3 bg-primary/5 border-b border-primary/10">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <CardTitle className="text-base font-heading">
                  Live Tracking — {trackedSchedule.bus_number || trackedSchedule.bus?.bus_number}
                </CardTitle>
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                  {trackedSchedule.route?.origin} → {trackedSchedule.route?.destination}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                {lastUpdated && (
                  <span className="text-xs text-muted-foreground">
                    Updated {format(lastUpdated, 'HH:mm:ss')}
                  </span>
                )}
                <Button size="sm" variant="ghost" onClick={() => setTrackedSchedule(null)}>
                  Close
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[380px]">
              <LiveBusMap bus={trackedBus} route={trackedRoute} />
            </div>
            {/* Route stops info bar */}
            {trackedRoute?.stops?.length > 0 && (
              <div className="px-4 py-3 bg-muted/50 border-t flex gap-2 overflow-x-auto">
                {[...trackedRoute.stops]
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  .map((stop, i) => (
                    <div key={i} className="flex items-center gap-1.5 shrink-0">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{stop.name}</span>
                      {i < trackedRoute.stops.length - 1 && (
                        <span className="text-muted-foreground/40 text-xs">→</span>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search by route, origin, destination, or bus number..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 h-12"
        />
      </div>

      {/* Schedule Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(s => {
          const isTracking = trackedSchedule?.id === s.id;
          return (
            <Card
              key={s.id}
              className={`hover:shadow-lg transition-all duration-200 group ${isTracking ? 'ring-2 ring-primary/40 shadow-md' : ''}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Bus className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-heading font-semibold">{s.bus_number || s.bus?.bus_number}</p>
                      <p className="text-xs text-muted-foreground">{s.bus?.model || 'Bus'}</p>
                    </div>
                  </div>
                  <StatusBadge status={s.bus?.status || 'Inactive'} />
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span>{s.route?.origin || '—'} → {s.route?.destination || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>{s.departure_time}{s.date ? ` — ${format(new Date(s.date), 'dd MMM')}` : ''}</span>
                  </div>
                  {s.route?.estimated_duration_min && (
                    <p className="text-muted-foreground text-xs">Est. {s.route.estimated_duration_min} min</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t gap-2">
                  <p className="text-lg font-heading font-bold text-primary">
                    {s.route?.fare ? `R${s.route.fare}` : 'Free'}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={isTracking ? 'default' : 'outline'}
                      onClick={() => handleTrack(s)}
                      className="gap-1.5"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      {isTracking ? 'Tracking' : 'Track'}
                    </Button>
                    <Button size="sm" onClick={() => handleBook(s)} className="gap-1.5">
                      <Ticket className="w-3.5 h-3.5" />Book
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            No buses found matching your search.
          </div>
        )}
      </div>

      {/* Booking Dialog */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Confirm Booking</DialogTitle>
          </DialogHeader>
          {selectedSchedule && (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-muted rounded-xl space-y-2 text-sm">
                <p><span className="text-muted-foreground">Route:</span> {selectedSchedule.route?.route_name}</p>
                <p><span className="text-muted-foreground">Bus:</span> {selectedSchedule.bus_number || selectedSchedule.bus?.bus_number}</p>
                <p><span className="text-muted-foreground">Date:</span> {selectedSchedule.date ? format(new Date(selectedSchedule.date), 'dd MMM yyyy') : '—'}</p>
                <p><span className="text-muted-foreground">Departure:</span> {selectedSchedule.departure_time}</p>
                <p><span className="text-muted-foreground">Fare:</span> R{selectedSchedule.route?.fare || 0}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setBookingOpen(false)}>Cancel</Button>
                <Button className="flex-1" onClick={confirmBook} disabled={bookMutation.isPending}>
                  {bookMutation.isPending ? 'Booking...' : 'Confirm Booking'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
