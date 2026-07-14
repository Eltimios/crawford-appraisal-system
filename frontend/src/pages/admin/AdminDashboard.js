import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AdminHome from './AdminHome';
import ManageUsersPage from './ManageUsersPage';
import DeadlinesPage from './DeadlinesPage';
import AdminReportsPage from './AdminReportsPage';
import AuditLogsPage from './AuditLogsPage';
import AdminSettingsPage from './AdminSettingsPage';
import ProfilePage from '../shared/ProfilePage';

const AdminDashboard = () => (
  <DashboardLayout>
    <Routes>
      <Route index element={<AdminHome />} />
      <Route path="users" element={<ManageUsersPage />} />
      <Route path="deadlines" element={<DeadlinesPage />} />
      <Route path="reports" element={<AdminReportsPage />} />
      <Route path="audit" element={<AuditLogsPage />} />
      <Route path="settings" element={<AdminSettingsPage />} />
      <Route path="profile" element={<ProfilePage />} />
    </Routes>
  </DashboardLayout>
);

export default AdminDashboard;
