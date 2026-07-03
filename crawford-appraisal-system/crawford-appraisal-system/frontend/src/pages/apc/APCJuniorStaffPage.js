import { useAuth } from '../../context/AuthContext';
import APCStaffListPage from './APCStaffListPage';

const APCJuniorStaffPage = () => {
  const { userProfile } = useAuth();
  const isJunior = userProfile?.role === 'apc_junior';
  const backPath = isJunior ? '/apc-junior' : '/apc/non-teaching';
  const detailPathPrefix = isJunior ? '/apc-junior/staff' : '/apc/staff';

  return (
    <APCStaffListPage
      title="Junior Non-Teaching Staff — Eligible for Review"
      category="non-teaching"
      type="junior"
      backPath={backPath}
      detailPathPrefix={detailPathPrefix}
    />
  );
};

export default APCJuniorStaffPage;
