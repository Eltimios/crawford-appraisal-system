import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DeanHome from './DeanHome';
import AppraisalPage from '../staff/AppraisalPage';
import AssessHODsPage from './AssessHODsPage';
import VCAssessDeansPage from './VCAssessDeansPage';
import DisputesPage from './DisputesPage';
import CollegeOverviewPage from './CollegeOverviewPage';
import DeanPublicationsPage from './DeanPublicationsPage';
import PublicationsPage from '../staff/PublicationsPage';
import MyAssessmentPage from '../staff/MyAssessmentPage';
import StaffBiodataPage from '../staff/StaffBiodataPage';
import StaffCVPage from '../staff/StaffCVPage';
import StaffOfficialCVPage from '../staff/StaffOfficialCVPage';
import NotificationsPage from '../shared/NotificationsPage';
import ProfilePage from '../shared/ProfilePage';
import ReviewQueuePage from '../collegeBoard/ReviewQueuePage';
import ApprovedPage from '../collegeBoard/ApprovedPage';
import CollegeReviewPage from './CollegeReviewPage';
import DeanMinutesPage from './DeanMinutesPage';
import DeanAssessorsPage from './DeanAssessorsPage';

const DeanDashboard = () => (
  <DashboardLayout>
    <Routes>
      <Route index element={<DeanHome />} />
      <Route path="appraisal" element={<AppraisalPage />} />
      <Route path="assessment" element={<MyAssessmentPage />} />
      <Route path="assess" element={<AssessHODsPage />} />
      <Route path="assess-deans" element={<VCAssessDeansPage />} />
      <Route path="disputes" element={<DisputesPage />} />
      <Route path="overview" element={<CollegeOverviewPage />} />
      <Route path="my-publications" element={<PublicationsPage />} />
      <Route path="publications" element={<DeanPublicationsPage />} />
      <Route path="college-review" element={<CollegeReviewPage />} />
      <Route path="review" element={<ReviewQueuePage />} />
      <Route path="approved" element={<ApprovedPage />} />
      <Route path="minutes" element={<DeanMinutesPage />} />
      <Route path="assessors" element={<DeanAssessorsPage />} />
      <Route path="biodata" element={<StaffBiodataPage />} />
      <Route path="cv" element={<StaffCVPage />} />
      <Route path="official-cv" element={<StaffOfficialCVPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="profile" element={<ProfilePage />} />
    </Routes>
  </DashboardLayout>
);

export default DeanDashboard;