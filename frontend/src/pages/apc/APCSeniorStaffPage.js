import { useAuth } from '../../context/AuthContext';
import APCStaffListPage from './APCStaffListPage';

const APCSeniorStaffPage = () => {
  const { userProfile } = useAuth();
  const isSenior = userProfile?.role === 'apc_senior';
  const backPath = isSenior ? '/apc-senior' : '/apc/non-teaching';
  const detailPathPrefix = isSenior ? '/apc-senior/staff' : '/apc/staff';

  return (
    <APCStaffListPage
      title="Senior Non-Teaching Staff — Eligible for Review"
      category="non-teaching"
      type="senior"
      backPath={backPath}
      detailPathPrefix={detailPathPrefix}
    />
  );
};

export default APCSeniorStaffPage;
