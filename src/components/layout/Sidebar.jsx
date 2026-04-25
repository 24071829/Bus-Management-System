import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Bus, Users, MapPin, Calendar, Ticket, 
  Bell, Navigation, LogOut, X, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const adminLinks = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/buses', label: 'Buses', icon: Bus },
  { path: '/drivers', label: 'Drivers', icon: Users },
  { path: '/routes', label: 'Routes', icon: MapPin },
  { path: '/schedules', label: 'Schedules', icon: Calendar },
  { path: '/tickets', label: 'Tickets', icon: Ticket },
  { path: '/notifications', label: 'Notifications', icon: Bell },
];

const passengerLinks = [
  { path: '/', label: 'Browse Buses', icon: Bus },
  { path: '/my-tickets', label: 'My Tickets', icon: Ticket },
  { path: '/track', label: 'Track Bus', icon: Navigation },
  { path: '/notifications', label: 'Notifications', icon: Bell },
];

const driverLinks = [
  { path: '/', label: 'My Schedule', icon: Calendar },
  { path: '/update-status', label: 'Update Status', icon: Bell },
  { path: '/notifications', label: 'Notifications', icon: Bell },
];

export default function Sidebar({ role, isOpen, setIsOpen, user, onLogout }) {
  const location = useLocation();

  const links = role === 'admin' ? adminLinks : role === 'driver' ? driverLinks : passengerLinks;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      <aside className={cn(
        "fixed top-0 left-0 h-full z-50 w-72 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 ease-out",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
                <Bus className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-lg font-bold text-sidebar-foreground">LimBus</h1>
                <p className="text-xs text-sidebar-foreground/50 capitalize">{role} Portal</p>
              </div>
            </div>
            <Button 
              variant="ghost" size="icon" 
              className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path + link.label}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <link.icon className="w-5 h-5" />
                <span>{link.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-semibold text-sidebar-foreground">
              {user?.full_name?.[0] || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-sidebar-foreground">{user?.full_name || user?.username || 'User'}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{user?.username}</p>
            </div>
            <Button 
              variant="ghost" size="icon"
              className="text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={onLogout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
