import HRStaffListPage from './HRStaffListPage';

const HRTeachingStaffPage = () => (
  <HRStaffListPage
    title="Teaching Staff (Academic)"
    fetchEndpoint="/hr/teaching-staff"
    exportCategory="teaching"
    exportType={null}
    backPath="/hr"
  />
);

export default HRTeachingStaffPage;
