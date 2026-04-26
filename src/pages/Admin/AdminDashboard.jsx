import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bus, Users, MapPin, Ticket, TrendingUp, AlertTriangle, CheckCircle2, Clock, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import { format } from 'date-fns';

const PIE_COLORS = ['hsl(152,60%,36%)', 'hsl(36,90%,55%)', 'hsl(200,70%,50%)', 'hsl(0,72%,51%)', 'hsl(150,10%,70%)'];

function StatCard({ title, value, sub, icon: IconComp, accent }) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-heading font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`p-3 rounded-2xl ${accent}`}>
            <IconComp className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${accent.includes('primary') ? 'bg-primary' : accent.includes('accent') ? 'bg-accent' : accent.includes('destructive') ? 'bg-destructive' : 'bg-chart-3'}`} />
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: buses = [] } = useQuery({ queryKey: ['buses'], queryFn: () => base44.entities.Bus.list(), refetchInterval: 15000 });
  const { data: drivers = [] } = useQuery({ queryKey: ['drivers'], queryFn: () => base44.entities.Driver.list() });
  const { data: routes = [] } = useQuery({ queryKey: ['routes'], queryFn: () => base44.entities.Route.list() });
  const { data: tickets = [] } = useQuery({ queryKey: ['tickets'], queryFn: () => base44.entities.Ticket.list() });
  const { data: notifications = [] } = useQuery({ queryKey: ['notifications'], queryFn: () => base44.entities.Notification.list('-created_date') });

  const activeBuses = buses.filter(b => b.status === 'Active').length;
  const delayedBuses = buses.filter(b => b.status === 'Delayed').length;
  const maintenanceBuses = buses.filter(b => b.status === 'Maintenance').length;
  const bookedTickets = tickets.filter(t => t.status === 'Booked').length;
  const availableDrivers = drivers.filter(d => d.status === 'Available').length;
  const unreadAlerts = notifications.filter(n => !n.is_read && (n.type === 'delay' || n.type === 'accident')).length;

  const statusData = ['Active', 'Inactive', 'Delayed', 'Completed', 'Maintenance']
    .map(s => ({ name: s, value: buses.filter(b => b.status === s).length }))
    .filter(d => d.value > 0);

  const routePerformance = routes.slice(0, 7).map(r => ({
    name: r.route_name?.length > 14 ? r.route_name.slice(0, 14) + '…' : r.route_name,
    tickets: tickets.filter(t => t.route_id === r.id).length,
    fare: r.fare || 0,
  }));

  // Revenue by route
  const revenueData = routes.slice(0, 6).map(r => ({
    name: r.route_name?.length > 10 ? r.route_name.slice(0, 10) + '…' : r.route_name,
    revenue: tickets.filter(t => t.route_id === r.id && t.status !== 'Cancelled').length * (r.fare || 0),
  }));

  const liveTrackedBuses = buses.filter(b => b.current_latitude && b.current_longitude);

  return (
    <div>
      <PageHeader title="Fleet Dashboard" description="Live overview of the LimBus public transport network" />

      {/* Alert Banner */}
      {(delayedBuses > 0 || unreadAlerts > 0) && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-accent/10 border border-accent/30 rounded-xl text-accent-foreground text-sm">
          <AlertTriangle className="w-5 h-5 text-accent shrink-0" />
          <span>
            <strong>{delayedBuses} bus{delayedBuses !== 1 ? 'es' : ''} delayed</strong>
            {unreadAlerts > 0 && ` · ${unreadAlerts} unread alert${unreadAlerts !== 1 ? 's' : ''}`}
            {maintenanceBuses > 0 && ` · ${maintenanceBuses} in maintenance`}
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Buses" value={buses.length} sub={`${liveTrackedBuses.length} broadcasting GPS`} icon={Bus} accent="bg-primary/10 text-primary" />
        <StatCard title="Active Now" value={activeBuses} sub={`${delayedBuses} delayed · ${maintenanceBuses} maintenance`} icon={Activity} accent="bg-green-100 text-green-700" />
        <StatCard title="Drivers" value={drivers.length} sub={`${availableDrivers} available`} icon={Users} accent="bg-chart-3/10 text-chart-3" />
        <StatCard title="Tickets Sold" value={bookedTickets} sub={`${tickets.filter(t => t.status === 'Cancelled').length} cancelled`} icon={Ticket} accent="bg-accent/10 text-accent" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Bus Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={100} dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`} labelLine={true}>
                    {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-center py-12">No data yet</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Tickets by Route</CardTitle>
          </CardHeader>
          <CardContent>
            {routePerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={routePerformance} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(150,12%,88%)" vertical={false} />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="tickets" fill="hsl(152,60%,36%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-center py-12">No data yet</p>}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      {revenueData.some(r => r.revenue > 0) && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="font-heading text-base">Revenue by Route (ZAR)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(152,60%,36%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(152,60%,36%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(150,12%,88%)" vertical={false} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={v => `R${v}`} />
                <Tooltip formatter={v => [`R${v}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(152,60%,36%)" fill="url(#rev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Fleet Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Fleet Status</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Bus #</th>
                  <th className="px-6 py-3 font-medium">Model</th>
                  <th className="px-6 py-3 font-medium">Driver</th>
                  <th className="px-6 py-3 font-medium">Route</th>
                  <th className="px-6 py-3 font-medium">GPS</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {buses.slice(0, 8).map(bus => (
                  <tr key={bus.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-semibold">{bus.bus_number}</td>
                    <td className="px-6 py-4 text-muted-foreground">{bus.model || '—'}</td>
                    <td className="px-6 py-4">{bus.assigned_driver_name || '—'}</td>
                    <td className="px-6 py-4">{bus.assigned_route_name || '—'}</td>
                    <td className="px-6 py-4">
                      {bus.current_latitude ? (
                        <span className="flex items-center gap-1.5 text-green-600 text-xs font-medium">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />Live
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">Offline</span>
                      )}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={bus.status} /></td>
                  </tr>
                ))}
                {buses.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">No buses added yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
