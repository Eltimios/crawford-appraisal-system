import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import HRHome from './HRHome';
import HRTeachingStaffPage from './HRTeachingStaffPage';
import HRNonTeachingHubPage from './HRNonTeachingHubPage';
import HRJuniorStaffPage from './HRJuniorStaffPage';
import HRSeniorStaffPage from './HRSeniorStaffPage';
import HRRecommendationsPage from './HRRecommendationsPage';
import HRMinutesPage from './HRMinutesPage';
import NotificationsPage from '../shared/NotificationsPage';
import ProfilePage from '../shared/ProfilePage';

const HRDashboard = () => (
  <DashboardLayout>
    <Routes>
      <Route index element={<HRHome />} />
      <Route path="teaching" element={<HRTeachingStaffPage />} />
      <Route path="non-teaching" element={<HRNonTeachingHubPage />} />
      <Route path="non-teaching/junior" element={<HRJuniorStaffPage />} />
      <Route path="non-teaching/senior" element={<HRSeniorStaffPage />} />
      <Route path="recommendations" element={<HRRecommendationsPage />} />
      <Route path="minutes" element={<HRMinutesPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="profile" element={<ProfilePage />} />
    </Routes>
  </DashboardLayout>
);

export default HRDashboard;
