import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';

import LoginPage from './pages/auth/LoginPage';
import StaffDashboard from './pages/staff/StaffDashboard';
import HODDashboard from './pages/hod/HODDashboard';
import DeanDashboard from './pages/dean/DeanDashboard';
import APCAcademicDashboard from './pages/apc/APCAcademicDashboard';
import APCJuniorDashboard from './pages/apc/APCJuniorDashboard';
import APCSeniorDashboard from './pages/apc/APCSeniorDashboard';
import CollegeBoardDashboard from './pages/collegeBoard/CollegeBoardDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import RegistryDashboard from './pages/registry/RegistryDashboard';
import HRDashboard from './pages/hr/HRDashboard';
import VCDashboard from './pages/vc/VCDashboard';
import ExternalAssessorPortal from './pages/ExternalAssessorPortal';
// Council portal is temporarily hidden — progress now terminates at A&PC.
// import CouncilDashboard from './pages/council/CouncilDashboard';

const roleHomeMap = {
  staff: '/staff',
  hod: '/hod',
  hou: '/hod',
  reporting_officer: '/hod',
  dean: '/dean',
  vc: '/vc',
  apc_academic: '/apc-academic',
  apc_junior:   '/apc-junior',
  apc_senior:   '/apc-senior',
  registry: '/registry',
  hr_personnel: '/hr',
  admin: '/admin',
};

const RootRedirect = () => {
  const { profile, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!profile) return <Navigate to="/login" replace />;
  return <Navigate to={roleHomeMap[profile.role] || '/login'} replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<RootRedirect />} />
            <Route path="/assessor-portal/:assessorId" element={<ExternalAssessorPortal />} />

            <Route path="/staff/*" element={
              <ProtectedRoute allowedRoles={['staff']}><StaffDashboard /></ProtectedRoute>
            } />
            <Route path="/hod/*" element={
              <ProtectedRoute allowedRoles={['hod', 'hou', 'reporting_officer']}><HODDashboard /></ProtectedRoute>
            } />
            <Route path="/dean/*" element={
              <ProtectedRoute allowedRoles={['dean']}><DeanDashboard /></ProtectedRoute>
            } />
            <Route path="/vc/*" element={
              <ProtectedRoute allowedRoles={['vc']}><VCDashboard /></ProtectedRoute>
            } />
            <Route path="/apc-academic/*" element={
              <ProtectedRoute allowedRoles={['apc_academic']}><APCAcademicDashboard /></ProtectedRoute>
            } />
            <Route path="/apc-junior/*" element={
              <ProtectedRoute allowedRoles={['apc_junior']}><APCJuniorDashboard /></ProtectedRoute>
            } />
            <Route path="/apc-senior/*" element={
              <ProtectedRoute allowedRoles={['apc_senior']}><APCSeniorDashboard /></ProtectedRoute>
            } />
            <Route path="/college-board/*" element={
              <ProtectedRoute allowedRoles={['college_board']}><CollegeBoardDashboard /></ProtectedRoute>
            } />
            <Route path="/registry/*" element={
              <ProtectedRoute allowedRoles={['registry']}><RegistryDashboard /></ProtectedRoute>
            } />
            <Route path="/hr/*" element={
              <ProtectedRoute allowedRoles={['hr_personnel']}><HRDashboard /></ProtectedRoute>
            } />
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
