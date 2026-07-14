import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import CollegeBoardHome from './CollegeBoardHome';
import ReviewQueuePage from './ReviewQueuePage';
import ApprovedPage from './ApprovedPage';
import NotificationsPage from '../shared/NotificationsPage';
import ProfilePage from '../shared/ProfilePage';

const CollegeBoardDashboard = () => (
  <DashboardLayout>
    <Routes>
      <Route index element={<CollegeBoardHome />} />
      <Route path="review" element={<ReviewQueuePage />} />
      <Route path="approved" element={<ApprovedPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="profile" element={<ProfilePage />} />
    </Routes>
  </DashboardLayout>
);

export default CollegeBoardDashboard;
