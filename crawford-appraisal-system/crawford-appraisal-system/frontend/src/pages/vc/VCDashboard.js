import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import VCHome from './VCHome';
import VCAssessDeansPage from '../dean/VCAssessDeansPage';
import VCUniversityOverviewPage from './VCUniversityOverviewPage';
import NotificationsPage from '../shared/NotificationsPage';
import ProfilePage from '../shared/ProfilePage';
import VCAssessorsPage from './VCAssessorsPage';

const VCDashboard = () => (
  <DashboardLayout>
    <Routes>
      <Route index element={<VCHome />} />
      <Route path="assess-deans" element={<VCAssessDeansPage />} />
      <Route path="overview" element={<VCUniversityOverviewPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="assessors" element={<VCAssessorsPage />} />
      <Route path="profile" element={<ProfilePage />} />
    </Routes>
  </DashboardLayout>
);

export default VCDashboard;
