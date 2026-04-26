import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import PageHeader from '@/components/shared/PageHeader';
import { toast } from 'sonner';

export default function RouteManagement() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ route_name: '', origin: '', destination: '', distance_km: '', estimated_duration_min: '', fare: '' });
  const [stops, setStops] = useState([]);

  const { data: routes = [], isLoading } = useQuery({ queryKey: ['routes'], queryFn: () => base44.entities.Route.list() });

  const saveMutation = useMutation({
    mutationFn: (data) => editing ? base44.entities.Route.update(editing.id, data) : base44.entities.Route.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['routes'] }); setOpen(false); setEditing(null); toast.success(editing ? 'Route updated' : 'Route added'); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Route.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['routes'] }); toast.success('Route deleted'); }
  });

  const openCreate = () => { setEditing(null); setForm({ route_name: '', origin: '', destination: '', distance_km: '', estimated_duration_min: '', fare: '' }); setStops([]); setOpen(true); };
  const openEdit = (r) => { 
    setEditing(r); 
    setForm({ route_name: r.route_name, origin: r.origin, destination: r.destination, distance_km: r.distance_km || '', estimated_duration_min: r.estimated_duration_min || '', fare: r.fare || '' }); 
    setStops(r.stops || []);
    setOpen(true); 
  };

  const addStop = () => setStops([...stops, { name: '', latitude: 0, longitude: 0, order: stops.length + 1 }]);
  const removeStop = (i) => setStops(stops.filter((_, idx) => idx !== i));
  const updateStop = (i, field, val) => { const s = [...stops]; s[i] = { ...s[i], [field]: val }; setStops(s); };

  const handleSave = () => {
    saveMutation.mutate({
      ...form,
      distance_km: form.distance_km ? Number(form.distance_km) : undefined,
      estimated_duration_min: form.estimated_duration_min ? Number(form.estimated_duration_min) : undefined,
      fare: form.fare ? Number(form.fare) : undefined,
      stops,
    });
  };

  return (
    <div>
      <PageHeader title="Route Management" description="Manage bus routes across Limpopo" actions={
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" />Add Route</Button>
      } />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {routes.map(r => (
          <Card key={r.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><MapPin className="w-5 h-5 text-primary" /></div>
                  <h3 className="font-heading font-semibold">{r.route_name}</h3>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="w-4 h-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Delete route?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(r.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">From:</span> {r.origin}</p>
                <p><span className="text-muted-foreground">To:</span> {r.destination}</p>
                {r.distance_km && <p><span className="text-muted-foreground">Distance:</span> {r.distance_km} km</p>}
                {r.estimated_duration_min && <p><span className="text-muted-foreground">Duration:</span> {r.estimated_duration_min} min</p>}
                {r.fare && <p><span className="text-muted-foreground">Fare:</span> R{r.fare}</p>}
                {r.stops?.length > 0 && <p><span className="text-muted-foreground">Stops:</span> {r.stops.length}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
        {!isLoading && routes.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground">No routes yet.</div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">{editing ? 'Edit Route' : 'Add Route'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label>Route Name</Label><Input value={form.route_name} onChange={e => setForm({...form, route_name: e.target.value})} placeholder="e.g. Thohoyandou - Polokwane" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Origin</Label><Input value={form.origin} onChange={e => setForm({...form, origin: e.target.value})} /></div>
              <div><Label>Destination</Label><Input value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Distance (km)</Label><Input type="number" value={form.distance_km} onChange={e => setForm({...form, distance_km: e.target.value})} /></div>
              <div><Label>Duration (min)</Label><Input type="number" value={form.estimated_duration_min} onChange={e => setForm({...form, estimated_duration_min: e.target.value})} /></div>
              <div><Label>Fare (ZAR)</Label><Input type="number" value={form.fare} onChange={e => setForm({...form, fare: e.target.value})} /></div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Stops</Label>
                <Button variant="outline" size="sm" onClick={addStop}>+ Add Stop</Button>
              </div>
              {stops.map((stop, i) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <Input placeholder="Stop name" value={stop.name} onChange={e => updateStop(i, 'name', e.target.value)} className="flex-1" />
                  <Button variant="ghost" size="icon" onClick={() => removeStop(i)} className="text-destructive shrink-0"><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : editing ? 'Update Route' : 'Add Route'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
