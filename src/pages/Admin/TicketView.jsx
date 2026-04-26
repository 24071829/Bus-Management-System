import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import { format } from 'date-fns';

export default function TicketView() {
  const { data: tickets = [], isLoading } = useQuery({ queryKey: ['tickets'], queryFn: () => base44.entities.Ticket.list('-created_date') });

  return (
    <div>
      <PageHeader title="Booked Tickets" description="View all passenger bookings" />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground bg-muted/50">
                  <th className="p-4 font-medium">Passenger</th>
                  <th className="p-4 font-medium">Route</th>
                  <th className="p-4 font-medium">Bus</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Departure</th>
                  <th className="p-4 font-medium">Fare</th>
                  <th className="p-4 font-medium">Seat</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{t.passenger_name}</p>
                        <p className="text-xs text-muted-foreground">{t.passenger_email}</p>
                      </div>
                    </td>
                    <td className="p-4">{t.route_name || '—'}</td>
                    <td className="p-4">{t.bus_number || '—'}</td>
                    <td className="p-4">{t.travel_date ? format(new Date(t.travel_date), 'dd MMM yyyy') : '—'}</td>
                    <td className="p-4">{t.departure_time || '—'}</td>
                    <td className="p-4 font-medium">{t.fare ? `R${t.fare}` : '—'}</td>
                    <td className="p-4">{t.seat_number || '—'}</td>
                    <td className="p-4"><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
                {!isLoading && tickets.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No tickets booked yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
