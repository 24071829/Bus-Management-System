import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { useState, useEffect } from 'react';

import { localAuth } from '@/lib/localAuth';
import HomePage from './pages/HomePage';
import AppLayout from './components/layout/AppLayout';
import RoleRouter from './pages/RoleRouter';
import BusManagement from './pages/admin/BusManagement';
import DriverManagement from './pages/admin/DriverManagement';
import RouteManagement from './pages/admin/RouteManagement';
import ScheduleManagement from './pages/admin/ScheduleManagement';
import TicketView from './pages/admin/TicketView';
import BrowseBuses from './pages/passenger/BrowseBuses';
import MyTickets from './pages/passenger/MyTickets';
import TrackBus from './pages/passenger/TrackBus';
import DriverSchedule from './pages/driver/DriverSchedule';
import UpdateStatus from './pages/driver/UpdateStatus';
import Notifications from './pages/shared/Notifications';

function App() {
  const [user, setUser] = useState(() => localAuth.getSession());

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localAuth.logout();
    setUser(null);
  };

  if (!user) {
    return (
      <QueryClientProvider client={queryClientInstance}>
        <HomePage onLogin={handleLogin} />
        <Toaster />
      </QueryClientProvider>
    );
  }

  const role = user.role || 'passenger';

  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Routes>
          <Route element={<AppLayout user={user} role={role} onLogout={handleLogout} />}>
            <Route path="/" element={<RoleRouter />} />
            {/* Admin only */}
            {role === 'admin' && <>
              <Route path="/buses" element={<BusManagement />} />
              <Route path="/drivers" element={<DriverManagement />} />
              <Route path="/routes" element={<RouteManagement />} />
              <Route path="/schedules" element={<ScheduleManagement />} />
              <Route path="/tickets" element={<TicketView />} />
            </>}
            {/* Passenger only */}
            {role === 'passenger' && <>
              <Route path="/my-tickets" element={<MyTickets />} />
              <Route path="/track" element={<TrackBus />} />
            </>}
            {/* Driver only */}
            {role === 'driver' && <>
              <Route path="/update-status" element={<UpdateStatus />} />
            </>}
            {/* Shared */}
            <Route path="/notifications" element={<Notifications />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App
