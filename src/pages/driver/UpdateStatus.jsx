import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useOutletContext } from 'react-router-dom';
import { AlertTriangle, Clock, Send, Bus, Wrench, MessageSquare, CheckCircle2, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/shared/PageHeader';
import { toast } from 'sonner';

const updateTypes = [
  { value: 'delay', label: 'Delay / Late Arrival', icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-200', description: 'Report a delay affecting departure or arrival time' },
  { value: 'accident', label: 'Accident / Breakdown', icon: Wrench, color: 'text-red-600 bg-red-50 border-red-200', description: 'Report a vehicle incident or mechanical failure' },
  { value: 'status_change', label: 'Status Change', icon: Navigation, color: 'text-primary bg-primary/10 border-primary/20', description: 'Update passengers on route or service changes' },
  { value: 'general', label: 'General Update', icon: MessageSquare, color: 'text-muted-foreground bg-muted border-border', description: 'Share a general message with passengers' },
];

const suggestions = {
  delay: ['Delayed due to traffic on N1 — expected 20 minutes late', 'Road construction causing delays near Tzaneen', 'Heavy rain reducing speed on R71 — expect 30 min delay'],
  accident: ['Vehicle breakdown — awaiting roadside assistance', 'Minor accident — passengers are safe, replacement bus dispatched', 'Tyre puncture on R40 — will resume shortly'],
  status_change: ['Bus now in service and on route', 'Route diverted due to roadblock — taking alternate route via R81', 'Running ahead of schedule, arriving 10 minutes early'],
  general: ['Thank you for your patience today', 'Please ensure you have your ticket ready for inspection', 'Reminder: No eating or drinking on the bus'],
};

export default function UpdateStatus() {
  const { user } = useOutletContext();
  const qc = useQueryClient();
  const [type, setType] = useState('delay');
  const [message, setMessage] = useState('');
  const [busId, setBusId] = useState('');

  const { data: buses = [] } = useQuery({ queryKey: ['buses'], queryFn: () => base44.entities.Bus.list() });
  const myBuses = user?.driver_id ? buses.filter(b => b.assigned_driver_id === user.driver_id) : buses;

  const notifyMutation = useMutation({
    mutationFn: (data) => base44.entities.Notification.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Status update sent to passengers and admin');
      setMessage('');
    }
  });

  const updateBusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Bus.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['buses'] }),
  });

  const handleSubmit = () => {
    if (!message.trim()) { toast.error('Please enter a message'); return; }
    const bus = buses.find(b => b.id === busId);
    const titles = {
      delay: 'Bus Delay Notification',
      accident: 'Incident Report',
      status_change: 'Bus Status Update',
      general: 'Driver Update',
    };
    notifyMutation.mutate({
      title: titles[type],
      message: message.trim(),
      type,
      bus_id: busId || undefined,
      bus_number: bus?.bus_number || '',
      target_audience: 'all',
    });
    if (type === 'delay' && busId) updateBusMutation.mutate({ id: busId, status: 'Delayed' });
    if (type === 'accident' && busId) updateBusMutation.mutate({ id: busId, status: 'Maintenance' });
  };

  const selectedType = updateTypes.find(t => t.value === type);
  const SelectedIcon = selectedType?.icon || AlertTriangle;

  return (
    <div>
      <PageHeader title="Send Status Update" description="Notify passengers and admin of any changes in real time" />

      <div className="max-w-2xl space-y-6">
        {/* Update type selector */}
        <div>
          <Label className="mb-3 block font-medium">Update Type</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {updateTypes.map(ut => {
              const Icon = ut.icon;
              return (
                <button
                  key={ut.value}
                  onClick={() => { setType(ut.value); setMessage(''); }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    type === ut.value ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40 bg-card'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border ${ut.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{ut.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{ut.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bus selector */}
        <div>
          <Label className="mb-2 block">Bus (optional)</Label>
          <Select value={busId || 'none'} onValueChange={v => setBusId(v === 'none' ? '' : v)}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select bus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No specific bus</SelectItem>
              {myBuses.map(b => (
                <SelectItem key={b.id} value={b.id}>
                  {b.bus_number}{b.assigned_route_name ? ` — ${b.assigned_route_name}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Message */}
        <div>
          <Label className="mb-2 block">Message</Label>
          <Textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Describe the situation clearly so passengers know what to expect..."
            className="min-h-[120px] resize-none"
          />
          {/* Quick suggestions */}
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-2">Quick messages:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions[type]?.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setMessage(s)}
                  className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors border border-border truncate max-w-[280px]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button
          className="w-full h-11 gap-2 text-base"
          onClick={handleSubmit}
          disabled={notifyMutation.isPending || !message.trim()}
        >
          <Send className="w-4 h-4" />
          {notifyMutation.isPending ? 'Sending...' : 'Send Update'}
        </Button>
      </div>
    </div>
  );
}
