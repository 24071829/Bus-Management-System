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

const STATUSES = ['Active', 'Inactive', 'Delayed', 'Completed', 'Maintenance'];

export default function BusManagement() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ bus_number: '', capacity: '', model: '', year: '', status: 'Inactive' });

  const { data: buses = [], isLoading } = useQuery({ queryKey: ['buses'], queryFn: () => base44.entities.Bus.list() });
  const { data: drivers = [] } = useQuery({ queryKey: ['drivers'], queryFn: () => base44.entities.Driver.list() });
  const { data: routes = [] } = useQuery({ queryKey: ['routes'], queryFn: () => base44.entities.Route.list() });

  const saveMutation = useMutation({
    mutationFn: (data) => editing 
      ? base44.entities.Bus.update(editing.id, data) 
      : base44.entities.Bus.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['buses'] });
      setOpen(false);
      setEditing(null);
      toast.success(editing ? 'Bus updated' : 'Bus added');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Bus.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['buses'] }); toast.success('Bus deleted'); }
  });

  const openCreate = () => { setEditing(null); setForm({ bus_number: '', capacity: '', model: '', year: '', status: 'Inactive' }); setOpen(true); };
  const openEdit = (bus) => { 
    setEditing(bus); 
    setForm({ 
      bus_number: bus.bus_number, capacity: bus.capacity, model: bus.model || '', 
      year: bus.year || '', status: bus.status || 'Inactive',
      assigned_driver_id: bus.assigned_driver_id || '', assigned_route_id: bus.assigned_route_id || ''
    }); 
    setOpen(true); 
  };

  const handleSave = () => {
    const driver = drivers.find(d => d.id === form.assigned_driver_id);
    const route = routes.find(r => r.id === form.assigned_route_id);
    const data = {
      ...form,
      capacity: Number(form.capacity),
      year: form.year ? Number(form.year) : undefined,
      assigned_driver_name: driver?.full_name || '',
      assigned_route_name: route?.route_name || '',
    };
    saveMutation.mutate(data);
  };

  return (
    <div>
      <PageHeader title="Bus Management" description="Manage your fleet of buses" actions={
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" />Add Bus</Button>
      } />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground bg-muted/50">
                  <th className="p-4 font-medium">Bus #</th>
                  <th className="p-4 font-medium">Model</th>
                  <th className="p-4 font-medium">Capacity</th>
                  <th className="p-4 font-medium">Driver</th>
                  <th className="p-4 font-medium">Route</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {buses.map(bus => (
                  <tr key={bus.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-semibold">{bus.bus_number}</td>
                    <td className="p-4 text-muted-foreground">{bus.model || '—'}</td>
                    <td className="p-4">{bus.capacity}</td>
                    <td className="p-4">{bus.assigned_driver_name || '—'}</td>
                    <td className="p-4">{bus.assigned_route_name || '—'}</td>
                    <td className="p-4"><StatusBadge status={bus.status} /></td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(bus)}><Pencil className="w-4 h-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete bus {bus.bus_number}?</AlertDialogTitle>
                              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(bus.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && buses.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No buses yet. Add your first bus.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-heading">{editing ? 'Edit Bus' : 'Add New Bus'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Bus Number</Label><Input value={form.bus_number} onChange={e => setForm({...form, bus_number: e.target.value})} placeholder="e.g. LP-001" /></div>
              <div><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} placeholder="e.g. 60" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Model</Label><Input value={form.model} onChange={e => setForm({...form, model: e.target.value})} placeholder="e.g. Toyota Coaster" /></div>
              <div><Label>Year</Label><Input type="number" value={form.year} onChange={e => setForm({...form, year: e.target.value})} placeholder="e.g. 2022" /></div>
            </div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Assign Driver</Label>
              <Select value={form.assigned_driver_id || 'none'} onValueChange={v => setForm({...form, assigned_driver_id: v === 'none' ? '' : v})}>
                <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No driver</SelectItem>
                  {drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Assign Route</Label>
              <Select value={form.assigned_route_id || 'none'} onValueChange={v => setForm({...form, assigned_route_id: v === 'none' ? '' : v})}>
                <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No route</SelectItem>
                  {routes.map(r => <SelectItem key={r.id} value={r.id}>{r.route_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : editing ? 'Update Bus' : 'Add Bus'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
