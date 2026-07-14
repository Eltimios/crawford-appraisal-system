import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import CouncilHome from './CouncilHome';
import CouncilPendingPage from './CouncilPendingPage';
import CouncilDecidedPage from './CouncilDecidedPage';
import CouncilMinutesPage from './CouncilMinutesPage';
import NotificationsPage from '../shared/NotificationsPage';
import ProfilePage from '../shared/ProfilePage';

const CouncilDashboard = () => (
  <DashboardLayout>
    <Routes>
      <Route index element={<CouncilHome />} />
      <Route path="pending" element={<CouncilPendingPage />} />
      <Route path="decided" element={<CouncilDecidedPage />} />
      <Route path="minutes" element={<CouncilMinutesPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="profile" element={<ProfilePage />} />
    </Routes>
  </DashboardLayout>
);

export default CouncilDashboard;
