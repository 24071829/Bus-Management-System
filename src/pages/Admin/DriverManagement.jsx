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

const STATUSES = ['Available', 'On Duty', 'Off Duty', 'On Leave'];

export default function DriverManagement() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ full_name: '', phone: '', license_number: '', email: '', status: 'Available' });

  const { data: drivers = [], isLoading } = useQuery({ queryKey: ['drivers'], queryFn: () => base44.entities.Driver.list() });

  const saveMutation = useMutation({
    mutationFn: (data) => editing ? base44.entities.Driver.update(editing.id, data) : base44.entities.Driver.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['drivers'] }); setOpen(false); setEditing(null); toast.success(editing ? 'Driver updated' : 'Driver added'); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Driver.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['drivers'] }); toast.success('Driver deleted'); }
  });

  const openCreate = () => { setEditing(null); setForm({ full_name: '', phone: '', license_number: '', email: '', status: 'Available' }); setOpen(true); };
  const openEdit = (d) => { setEditing(d); setForm({ full_name: d.full_name, phone: d.phone, license_number: d.license_number, email: d.email || '', status: d.status || 'Available' }); setOpen(true); };

  return (
    <div>
      <PageHeader title="Driver Management" description="Manage all registered drivers" actions={
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" />Add Driver</Button>
      } />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground bg-muted/50">
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Phone</th>
                  <th className="p-4 font-medium">License</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(d => (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-semibold">{d.full_name}</td>
                    <td className="p-4 text-muted-foreground">{d.phone}</td>
                    <td className="p-4">{d.license_number}</td>
                    <td className="p-4 text-muted-foreground">{d.email || '—'}</td>
                    <td className="p-4"><StatusBadge status={d.status} /></td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(d)}><Pencil className="w-4 h-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete driver {d.full_name}?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(d.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && drivers.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No drivers yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-heading">{editing ? 'Edit Driver' : 'Add New Driver'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label>Full Name</Label><Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
              <div><Label>License Number</Label><Input value={form.license_number} onChange={e => setForm({...form, license_number: e.target.value})} /></div>
            </div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : editing ? 'Update Driver' : 'Add Driver'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
