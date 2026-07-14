import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StaffHome from './StaffHome';
import AppraisalPage from './AppraisalPage';
import PublicationsPage from './PublicationsPage';
import MyAssessmentPage from './MyAssessmentPage';
import StaffBiodataPage from './StaffBiodataPage';
import StaffCVPage from './StaffCVPage';
import StaffOfficialCVPage from './StaffOfficialCVPage';
import NotificationsPage from '../shared/NotificationsPage';
import ProfilePage from '../shared/ProfilePage';

const StaffDashboard = () => (
  <DashboardLayout>
    <Routes>
      <Route index element={<StaffHome />} />
      <Route path="appraisal" element={<AppraisalPage />} />
      <Route path="publications" element={<PublicationsPage />} />
      <Route path="assessment" element={<MyAssessmentPage />} />
      <Route path="biodata" element={<StaffBiodataPage />} />
      <Route path="cv" element={<StaffCVPage />} />
      <Route path="official-cv" element={<StaffOfficialCVPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="profile" element={<ProfilePage />} />
    </Routes>
  </DashboardLayout>
);

export default StaffDashboard;