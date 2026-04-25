import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusStyles = {
  Active: 'bg-primary/10 text-primary border-primary/20',
  Inactive: 'bg-muted text-muted-foreground border-border',
  Delayed: 'bg-accent/20 text-accent-foreground border-accent/30',
  Completed: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  Maintenance: 'bg-destructive/10 text-destructive border-destructive/20',
  Available: 'bg-primary/10 text-primary border-primary/20',
  'On Duty': 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  'Off Duty': 'bg-muted text-muted-foreground border-border',
  'On Leave': 'bg-accent/20 text-accent-foreground border-accent/30',
  Booked: 'bg-primary/10 text-primary border-primary/20',
  Cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
  Scheduled: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  'In Progress': 'bg-accent/20 text-accent-foreground border-accent/30',
};

export default function StatusBadge({ status }) {
  return (
    <Badge variant="outline" className={cn('font-medium', statusStyles[status] || 'bg-muted text-muted-foreground')}>
      {status}
    </Badge>
  );
}
