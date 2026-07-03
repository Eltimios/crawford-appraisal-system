import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages — to be built by Antigravity agent
// import LoginPage from './pages/auth/LoginPage';
// import StaffDashboard from './pages/staff/StaffDashboard';
// import HODDashboard from './pages/hod/HODDashboard';
// import DeanDashboard from './pages/dean/DeanDashboard';
// import CollegeBoardDashboard from './pages/collegeBoard/CollegeBoardDashboard';
// import APCDashboard from './pages/apc/APCDashboard';
// import AdminDashboard from './pages/admin/AdminDashboard';

// Route guard component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!profile) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
};

// Role-based redirect after login
const RoleRedirect = () => {
  const { profile } = useAuth();
  const redirectMap = {
    staff: '/staff/dashboard',
    hod: '/hod/dashboard',
    hou: '/hod/dashboard',
    dean: '/dean/dashboard',
    college_board: '/college-board/dashboard',
    apc: '/apc/dashboard',
    admin: '/admin/dashboard'
  };
  return <Navigate to={redirectMap[profile?.role] || '/login'} replace />;
};

const LoadingScreen = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    flexDirection: 'column',
    gap: '16px'
  }}>
    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a3c5e' }}>
      Crawford University
    </div>
    <div style={{ color: '#666' }}>Loading Appraisal System...</div>
  </div>
);

const UnauthorizedPage = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    flexDirection: 'column'
  }}>
    <h1>403 — Access Denied</h1>
    <p>You do not have permission to view this page.</p>
  </div>
);

// Temporary placeholder — replace with actual LoginPage component
const LoginPlaceholder = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    flexDirection: 'column',
    gap: '12px'
  }}>
    <h1 style={{ color: '#1a3c5e' }}>Crawford University</h1>
    <h2>Staff Appraisal Management System</h2>
    <p style={{ color: '#666' }}>Login page — to be built</p>
  </div>
);

function AppRoutes() {
  const { profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={
        profile ? <RoleRedirect /> : <LoginPlaceholder />
        // Replace LoginPlaceholder with: <LoginPage />
      } />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Staff */}
      <Route path="/staff/*" element={
        <ProtectedRoute allowedRoles={['staff']}>
          <div>Staff Dashboard — to be built</div>
          {/* Replace with: <StaffDashboard /> */}
        </ProtectedRoute>
      } />

      {/* HOD / HOU */}
      <Route path="/hod/*" element={
        <ProtectedRoute allowedRoles={['hod', 'hou']}>
          <div>HOD Dashboard — to be built</div>
          {/* Replace with: <HODDashboard /> */}
        </ProtectedRoute>
      } />

      {/* Dean */}
      <Route path="/dean/*" element={
        <ProtectedRoute allowedRoles={['dean']}>
          <div>Dean Dashboard — to be built</div>
          {/* Replace with: <DeanDashboard /> */}
        </ProtectedRoute>
      } />

      {/* College Board */}
      <Route path="/college-board/*" element={
        <ProtectedRoute allowedRoles={['college_board']}>
          <div>College Board Dashboard — to be built</div>
          {/* Replace with: <CollegeBoardDashboard /> */}
        </ProtectedRoute>
      } />

      {/* A&PC */}
      <Route path="/apc/*" element={
        <ProtectedRoute allowedRoles={['apc']}>
          <div>APC Dashboard — to be built</div>
          {/* Replace with: <APCDashboard /> */}
        </ProtectedRoute>
      } />

      {/* Admin */}
      <Route path="/admin/*" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <div>Admin Dashboard — to be built</div>
          {/* Replace with: <AdminDashboard /> */}
        </ProtectedRoute>
      } />

      {/* Default */}
      <Route path="/" element={
        profile ? <RoleRedirect /> : <Navigate to="/login" replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
