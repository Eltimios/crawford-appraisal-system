import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import APCHome from './APCHome';
import APCTeachingStaffPage from './APCTeachingStaffPage';
import APCStaffDetailPage from './APCStaffDetailPage';
import APCReportsPage from './APCReportsPage';
import APCMinutesPage from './APCMinutesPage';
import NotificationsPage from '../shared/NotificationsPage';
import ProfilePage from '../shared/ProfilePage';

const APCAcademicDashboard = () => (
  <DashboardLayout>
    <Routes>
      <Route index element={<APCHome />} />
      <Route path="teaching" element={<APCTeachingStaffPage />} />
      <Route path="staff/:staffId" element={<APCStaffDetailPage />} />
      <Route path="reports" element={<APCReportsPage />} />
      <Route path="minutes" element={<APCMinutesPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="profile" element={<ProfilePage />} />
    </Routes>
  </DashboardLayout>
);

export default APCAcademicDashboard;
