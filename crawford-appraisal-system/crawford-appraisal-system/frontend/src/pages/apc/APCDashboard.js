import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import APCHome from './APCHome';
import APCTeachingStaffPage from './APCTeachingStaffPage';
import APCNonTeachingHubPage from './APCNonTeachingHubPage';
import APCJuniorStaffPage from './APCJuniorStaffPage';
import APCSeniorStaffPage from './APCSeniorStaffPage';
import APCStaffDetailPage from './APCStaffDetailPage';
import APCReportsPage from './APCReportsPage';
import APCMinutesPage from './APCMinutesPage';
import NotificationsPage from '../shared/NotificationsPage';
import ProfilePage from '../shared/ProfilePage';

const APCDashboard = () => (
  <DashboardLayout>
    <Routes>
      <Route index element={<APCHome />} />
      <Route path="teaching" element={<APCTeachingStaffPage />} />
      <Route path="non-teaching" element={<APCNonTeachingHubPage />} />
      <Route path="non-teaching/junior" element={<APCJuniorStaffPage />} />
      <Route path="non-teaching/senior" element={<APCSeniorStaffPage />} />
      <Route path="staff/:staffId" element={<APCStaffDetailPage />} />
      <Route path="reports" element={<APCReportsPage />} />
      <Route path="minutes" element={<APCMinutesPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="profile" element={<ProfilePage />} />
    </Routes>
  </DashboardLayout>
);

export default APCDashboard;
