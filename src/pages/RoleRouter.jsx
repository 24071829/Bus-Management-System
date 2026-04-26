import React from 'react';
import { useOutletContext } from 'react-router-dom';
import AdminDashboard from './admin/AdminDashboard';
import BrowseBuses from './passenger/BrowseBuses';
import DriverSchedule from './driver/DriverSchedule';

export default function RoleRouter() {
  const { role } = useOutletContext();

  if (role === 'admin') return <AdminDashboard />;
  if (role === 'driver') return <DriverSchedule />;
  return <BrowseBuses />;
}
