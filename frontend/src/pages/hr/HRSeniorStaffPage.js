import HRStaffListPage from './HRStaffListPage';

const HRSeniorStaffPage = () => (
  <HRStaffListPage
    title="Senior Non-Teaching Staff"
    fetchEndpoint="/hr/non-teaching-staff?type=senior"
    exportCategory="non-teaching"
    exportType="senior"
    backPath="/hr/non-teaching"
  />
);

export default HRSeniorStaffPage;
