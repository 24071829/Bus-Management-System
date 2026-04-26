import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOutletContext } from 'react-router-dom';
import { Calendar, Clock, MapPin, Bus, CheckCircle2, AlertTriangle, Navigation } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';

function dateLabel(dateStr) {
  if (!dateStr) return '—';
  const d = parseISO(dateStr);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'EEEE, dd MMM');
}

const statusIcon = {
  Scheduled: Clock,
  'In Progress': Navigation,
  Completed: CheckCircle2,
  Cancelled: AlertTriangle,
  Delayed: AlertTriangle,
};

export default function DriverSchedule() {
  const { user } = useOutletContext();

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['driver-schedules', user?.driver_id],
    queryFn: () => user?.driver_id
      ? base44.entities.Schedule.filter({ driver_id: user.driver_id }, '-date')
      : base44.entities.Schedule.list('-date'),
    refetchInterval: 30000,
  });

  const today = schedules.filter(s => s.date && isToday(parseISO(s.date)));
  const upcoming = schedules.filter(s => s.date && !isToday(parseISO(s.date)));

  const Section = ({ title, items }) => (
    <>
      <h2 className="font-heading font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="space-y-3 mb-8">
        {items.map(s => {
          const StatusIcon = statusIcon[s.status] || Clock;
          const isInProgress = s.status === 'In Progress';
          return (
            <Card key={s.id} className={`transition-all hover:shadow-md ${isInProgress ? 'ring-2 ring-primary/30 shadow-md' : ''}`}>
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${isInProgress ? 'bg-primary text-primary-foreground' : 'bg-primary/10'}`}>
                      <Bus className={`w-6 h-6 ${isInProgress ? 'text-primary-foreground' : 'text-primary'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-heading font-semibold">{s.route_name || 'Route'}</h3>
                        {isInProgress && (
                          <span className="flex items-center gap-1 text-xs text-primary font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />On route
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">Bus: <span className="font-medium text-foreground">{s.bus_number || '—'}</span></p>
                    </div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Date</p>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      {dateLabel(s.date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Departure</p>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      {s.departure_time || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Arrival</p>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      {s.arrival_time || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Route</p>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      {s.route_name || '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );

  return (
    <div>
      <PageHeader title="My Schedule" description="Your assigned bus routes and trip details" />

      {schedules.length === 0 && !isLoading && (
        <div className="text-center py-24 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Calendar className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="font-heading font-semibold text-lg mb-2">No schedules assigned</h3>
          <p className="text-muted-foreground">Check back later or contact your supervisor.</p>
        </div>
      )}

      {today.length > 0 && <Section title="Today" items={today} />}
      {upcoming.length > 0 && <Section title="Upcoming" items={upcoming} />}
    </div>
  );
}
