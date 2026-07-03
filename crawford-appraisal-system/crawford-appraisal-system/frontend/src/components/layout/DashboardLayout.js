import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const roleDataAttr = {
  staff: 'staff',
  hod: 'hod',
  hou: 'hod',
  dean: 'dean',
  vc: 'vc',
  college_board: 'college_board',
  apc_academic: 'apc',
  apc_junior:   'apc',
  apc_senior:   'apc',
  council: 'council',
  admin: 'admin',
};

const DashboardLayout = ({ children }) => {
  const { userRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-layout" data-role={roleDataAttr[userRole] || 'staff'}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
