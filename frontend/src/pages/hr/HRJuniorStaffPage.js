import HRStaffListPage from './HRStaffListPage';

const HRJuniorStaffPage = () => (
  <HRStaffListPage
    title="Junior Non-Teaching Staff"
    fetchEndpoint="/hr/non-teaching-staff?type=junior"
    exportCategory="non-teaching"
    exportType="junior"
    backPath="/hr/non-teaching"
  />
);

export default HRJuniorStaffPage;
