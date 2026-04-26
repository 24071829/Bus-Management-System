import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import { toast } from 'sonner';
import { format } from 'date-fns';

const STATUSES = ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Delayed'];

export default function ScheduleManagement() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ bus_id: '', driver_id: '', route_id: '', departure_time: '', arrival_time: '', date: '', status: 'Scheduled' });

  const { data: schedules = [], isLoading } = useQuery({ queryKey: ['schedules'], queryFn: () => base44.entities.Schedule.list('-date') });
  const { data: buses = [] } = useQuery({ queryKey: ['buses'], queryFn: () => base44.entities.Bus.list() });
  const { data: drivers = [] } = useQuery({ queryKey: ['drivers'], queryFn: () => base44.entities.Driver.list() });
  const { data: routes = [] } = useQuery({ queryKey: ['routes'], queryFn: () => base44.entities.Route.list() });

  const saveMutation = useMutation({
    mutationFn: (data) => editing ? base44.entities.Schedule.update(editing.id, data) : base44.entities.Schedule.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['schedules'] }); setOpen(false); setEditing(null); toast.success(editing ? 'Schedule updated' : 'Schedule created'); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Schedule.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['schedules'] }); toast.success('Schedule deleted'); }
  });

  const openCreate = () => { setEditing(null); setForm({ bus_id: '', driver_id: '', route_id: '', departure_time: '', arrival_time: '', date: '', status: 'Scheduled' }); setOpen(true); };
  const openEdit = (s) => { setEditing(s); setForm({ bus_id: s.bus_id, driver_id: s.driver_id || '', route_id: s.route_id, departure_time: s.departure_time, arrival_time: s.arrival_time || '', date: s.date, status: s.status || 'Scheduled' }); setOpen(true); };

  const handleSave = () => {
    const bus = buses.find(b => b.id === form.bus_id);
    const driver = drivers.find(d => d.id === form.driver_id);
    const route = routes.find(r => r.id === form.route_id);
    saveMutation.mutate({
      ...form,
      bus_number: bus?.bus_number || '',
      driver_name: driver?.full_name || '',
      route_name: route?.route_name || '',
    });
  };

  return (
    <div>
      <PageHeader title="Schedules" description="Create and manage bus schedules for drivers" actions={
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" />New Schedule</Button>
      } />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground bg-muted/50">
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Bus</th>
                  <th className="p-4 font-medium">Driver</th>
                  <th className="p-4 font-medium">Route</th>
                  <th className="p-4 font-medium">Departure</th>
                  <th className="p-4 font-medium">Arrival</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map(s => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium">{s.date ? format(new Date(s.date), 'dd MMM yyyy') : '—'}</td>
                    <td className="p-4">{s.bus_number || '—'}</td>
                    <td className="p-4">{s.driver_name || '—'}</td>
                    <td className="p-4">{s.route_name || '—'}</td>
                    <td className="p-4">{s.departure_time}</td>
                    <td className="p-4">{s.arrival_time || '—'}</td>
                    <td className="p-4"><StatusBadge status={s.status} /></td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="w-4 h-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete this schedule?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(s.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && schedules.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No schedules yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-heading">{editing ? 'Edit Schedule' : 'New Schedule'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
            <div><Label>Bus</Label>
              <Select value={form.bus_id || 'none'} onValueChange={v => setForm({...form, bus_id: v === 'none' ? '' : v})}>
                <SelectTrigger><SelectValue placeholder="Select bus" /></SelectTrigger>
                <SelectContent>{buses.map(b => <SelectItem key={b.id} value={b.id}>{b.bus_number} — {b.model || 'Bus'}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Driver</Label>
              <Select value={form.driver_id || 'none'} onValueChange={v => setForm({...form, driver_id: v === 'none' ? '' : v})}>
                <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No driver</SelectItem>
                  {drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Route</Label>
              <Select value={form.route_id || 'none'} onValueChange={v => setForm({...form, route_id: v === 'none' ? '' : v})}>
                <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                <SelectContent>{routes.map(r => <SelectItem key={r.id} value={r.id}>{r.route_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Departure Time</Label><Input type="time" value={form.departure_time} onChange={e => setForm({...form, departure_time: e.target.value})} /></div>
              <div><Label>Arrival Time</Label><Input type="time" value={form.arrival_time} onChange={e => setForm({...form, arrival_time: e.target.value})} /></div>
            </div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : editing ? 'Update Schedule' : 'Create Schedule'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
