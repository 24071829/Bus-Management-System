import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOutletContext } from 'react-router-dom';
import { Ticket, X, Bus, MapPin, Calendar, Clock, CheckCircle2, QrCode } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import { toast } from 'sonner';
import { format, isPast, parseISO } from 'date-fns';

const statusGradient = {
  Booked: 'from-primary to-primary/70',
  Completed: 'from-chart-3 to-chart-3/70',
  Cancelled: 'from-muted-foreground to-muted-foreground/70',
};

export default function MyTickets() {
  const { user } = useOutletContext();
  const qc = useQueryClient();

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['my-tickets', user?.email || user?.username],
    queryFn: () => base44.entities.Ticket.filter(
      { passenger_email: user?.email || user?.username },
      '-created_date'
    ),
    enabled: !!(user?.email || user?.username),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => base44.entities.Ticket.update(id, { status: 'Cancelled' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-tickets'] });
      toast.success('Ticket cancelled successfully');
    },
  });

  const activeTickets = tickets.filter(t => t.status === 'Booked');
  const pastTickets = tickets.filter(t => t.status !== 'Booked');

  const TicketCard = ({ t }) => (
    <Card className={`overflow-hidden transition-all hover:shadow-lg ${t.status === 'Cancelled' ? 'opacity-60' : ''}`}>
      {/* Colored top bar */}
      <div className={`h-1.5 bg-gradient-to-r ${statusGradient[t.status] || statusGradient.Completed}`} />
      <CardContent className="p-0">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-heading font-bold text-lg leading-tight">{t.route_name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ticket <span className="font-mono font-semibold text-foreground">#{t.id?.slice(-8).toUpperCase()}</span>
            </p>
          </div>
          <StatusBadge status={t.status} />
        </div>

        {/* Divider with dots */}
        <div className="relative flex items-center mx-5 my-0">
          <div className="flex-1 border-t border-dashed border-border" />
          <div className="w-3 h-3 rounded-full bg-muted border border-border mx-2 shrink-0" />
          <div className="flex-1 border-t border-dashed border-border" />
        </div>

        {/* Details */}
        <div className="px-5 py-4 grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10"><Bus className="w-3.5 h-3.5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Bus</p>
              <p className="font-medium">{t.bus_number || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-muted"><MapPin className="w-3.5 h-3.5 text-muted-foreground" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Seat</p>
              <p className="font-medium">{t.seat_number || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-muted"><Calendar className="w-3.5 h-3.5 text-muted-foreground" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium">{t.travel_date ? format(parseISO(t.travel_date), 'dd MMM yyyy') : '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-muted"><Clock className="w-3.5 h-3.5 text-muted-foreground" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Departs</p>
              <p className="font-medium">{t.departure_time || '—'}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex items-center justify-between border-t pt-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Fare</p>
            <p className="text-2xl font-heading font-bold text-primary">R{t.fare || 0}</p>
          </div>
          {t.status === 'Booked' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/5 gap-1.5">
                  <X className="w-3.5 h-3.5" />Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel this ticket?</AlertDialogTitle>
                  <AlertDialogDescription>This will cancel your booking for <strong>{t.route_name}</strong> on {t.travel_date ? format(parseISO(t.travel_date), 'dd MMM yyyy') : 'this date'}. You can rebook if seats are still available.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Ticket</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => cancelMutation.mutate(t.id)}>Yes, Cancel</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {t.status === 'Completed' && (
            <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <CheckCircle2 className="w-4 h-4" />Trip completed
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div>
      <PageHeader
        title="My Tickets"
        description="Your booked trips and travel history"
        actions={
          activeTickets.length > 0 && (
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 px-3 py-1">
              {activeTickets.length} active booking{activeTickets.length !== 1 ? 's' : ''}
            </Badge>
          )
        }
      />

      {tickets.length === 0 && !isLoading && (
        <div className="text-center py-24 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Ticket className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="font-heading font-semibold text-lg mb-2">No tickets yet</h3>
          <p className="text-muted-foreground max-w-xs">Browse available buses and book your first trip!</p>
        </div>
      )}

      {activeTickets.length > 0 && (
        <>
          <h2 className="font-heading font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">Active Bookings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {activeTickets.map(t => <TicketCard key={t.id} t={t} />)}
          </div>
        </>
      )}

      {pastTickets.length > 0 && (
        <>
          <h2 className="font-heading font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">Past Trips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pastTickets.map(t => <TicketCard key={t.id} t={t} />)}
          </div>
        </>
      )}
    </div>
  );
}
