import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import RegistryHome from './RegistryHome';
import PendingValidationPage from './PendingValidationPage';
import RegistryDisputesPage from './RegistryDisputesPage';
import RegistryAssessROPage from './RegistryAssessROPage';
import RegistryOverviewPage from './RegistryOverviewPage';
import RegistryRecommendationsPage from './RegistryRecommendationsPage';
import NotificationsPage from '../shared/NotificationsPage';
import ProfilePage from '../shared/ProfilePage';

const RegistryDashboard = () => (
  <DashboardLayout>
    <Routes>
      <Route index element={<RegistryHome />} />
      <Route path="overview" element={<RegistryOverviewPage />} />
      <Route path="recommendations" element={<RegistryRecommendationsPage />} />
      <Route path="pending" element={<PendingValidationPage />} />
      <Route path="assess-ro" element={<RegistryAssessROPage />} />
      <Route path="disputes" element={<RegistryDisputesPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="profile" element={<ProfilePage />} />
    </Routes>
  </DashboardLayout>
);

export default RegistryDashboard;
