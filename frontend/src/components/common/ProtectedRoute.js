import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const dashboardMap = {
  staff: '/staff',
  hod: '/hod',
  hou: '/hod',
  reporting_officer: '/hod',
  dean: '/dean',
  vc: '/vc',
  registry: '/registry',
  hr_personnel: '/hr',
  college_board: '/college-board',
  apc_academic: '/apc-academic',
  apc_junior:   '/apc-junior',
  apc_senior:   '/apc-senior',
  council: '/council',
  admin: '/admin',
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { profile, loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;

  if (!profile) return <Navigate to="/login" replace />;

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to={dashboardMap[profile.role] || '/login'} replace />;
  }

  return children;
};

export default ProtectedRoute;
