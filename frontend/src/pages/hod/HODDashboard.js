import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import HODHome from './HODHome';
import AppraisalPage from '../staff/AppraisalPage';
import AssessStaffPage from './AssessStaffPage';
import HODMyAssessmentPage from './HODMyAssessmentPage';
import HODPublicationsPage from './HODPublicationsPage';
import PublicationsPage from '../staff/PublicationsPage';
import StaffBiodataPage from '../staff/StaffBiodataPage';
import StaffCVPage from '../staff/StaffCVPage';
import StaffOfficialCVPage from '../staff/StaffOfficialCVPage';
import NotificationsPage from '../shared/NotificationsPage';
import ProfilePage from '../shared/ProfilePage';

const HODDashboard = () => (
  <DashboardLayout>
    <Routes>
      <Route index element={<HODHome />} />
      <Route path="appraisal" element={<AppraisalPage />} />
      <Route path="assess" element={<AssessStaffPage />} />
      <Route path="assessment" element={<HODMyAssessmentPage />} />
      <Route path="my-publications" element={<PublicationsPage />} />
      <Route path="publications" element={<HODPublicationsPage />} />
      <Route path="biodata" element={<StaffBiodataPage />} />
      <Route path="cv" element={<StaffCVPage />} />
      <Route path="official-cv" element={<StaffOfficialCVPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="profile" element={<ProfilePage />} />
    </Routes>
  </DashboardLayout>
);

export default HODDashboard;