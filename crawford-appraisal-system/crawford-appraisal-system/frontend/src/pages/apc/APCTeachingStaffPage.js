import { useAuth } from '../../context/AuthContext';
import APCStaffListPage from './APCStaffListPage';

const APCTeachingStaffPage = () => {
  const { userProfile } = useAuth();
  const isAcademic = userProfile?.role === 'apc_academic';
  const backPath = isAcademic ? '/apc-academic' : '/apc';
  const detailPathPrefix = isAcademic ? '/apc-academic/staff' : '/apc/staff';

  return (
    <APCStaffListPage
      title="Teaching Staff — Eligible for Review"
      category="teaching"
      type={null}
      backPath={backPath}
      detailPathPrefix={detailPathPrefix}
    />
  );
};

export default APCTeachingStaffPage;
