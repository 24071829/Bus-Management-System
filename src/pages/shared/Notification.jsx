import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, AlertTriangle, Info, Bus, CheckCircle, CheckCheck, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/shared/PageHeader';
import { format, formatDistanceToNow } from 'date-fns';

const typeConfig = {
  delay: { icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-200', badge: 'Delay', badgeColor: 'bg-amber-100 text-amber-700' },
  accident: { icon: AlertTriangle, color: 'text-red-600 bg-red-50 border-red-200', badge: 'Incident', badgeColor: 'bg-red-100 text-red-700' },
  status_change: { icon: Bus, color: 'text-primary bg-primary/10 border-primary/20', badge: 'Status', badgeColor: 'bg-primary/10 text-primary' },
  general: { icon: Info, color: 'text-muted-foreground bg-muted border-border', badge: 'Info', badgeColor: 'bg-muted text-muted-foreground' },
};

export default function Notifications() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('all');

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.list('-created_date'),
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const filtered = filter === 'all' ? notifications
    : filter === 'unread' ? notifications.filter(n => !n.is_read)
    : notifications.filter(n => n.type === filter);

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
    { key: 'delay', label: 'Delays' },
    { key: 'accident', label: 'Incidents' },
    { key: 'general', label: 'General' },
  ];

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Stay informed about bus delays, incidents, and updates"
        actions={unreadCount > 0 && (
          <Button variant="outline" size="sm" className="gap-2" onClick={() => markAllReadMutation.mutate()} disabled={markAllReadMutation.isPending}>
            <CheckCheck className="w-4 h-4" />Mark all read
          </Button>
        )}
      />

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === f.key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-24 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Bell className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="font-heading font-semibold text-lg mb-2">No notifications</h3>
          <p className="text-muted-foreground">You're all caught up!</p>
        </div>
      )}

      <div className="space-y-3 max-w-3xl">
        {filtered.map(n => {
          const cfg = typeConfig[n.type] || typeConfig.general;
          const Icon = cfg.icon;
          return (
            <div
              key={n.id}
              className={`flex gap-4 p-4 rounded-xl border transition-all ${n.is_read ? 'bg-card opacity-60' : 'bg-card shadow-sm border-l-4'} ${!n.is_read && n.type === 'accident' ? 'border-l-red-500' : !n.is_read && n.type === 'delay' ? 'border-l-amber-500' : !n.is_read ? 'border-l-primary' : 'border-border'}`}
            >
              <div className={`p-2.5 rounded-xl border shrink-0 ${cfg.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{n.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badgeColor}`}>{cfg.badge}</span>
                    {n.bus_number && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">Bus {n.bus_number}</span>
                    )}
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {n.created_date ? formatDistanceToNow(new Date(n.created_date), { addSuffix: true }) : ''}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{n.message}</p>
                {!n.is_read && (
                  <button
                    className="mt-2 text-xs text-primary hover:text-primary/70 font-medium flex items-center gap-1 transition-colors"
                    onClick={() => markReadMutation.mutate(n.id)}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />Mark as read
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
