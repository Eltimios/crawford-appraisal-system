import MinutesView from '../../components/minutes/MinutesView';

const HRMinutesPage = () => (
  <MinutesView
    canUpload={false}
    viewTypes={['college_board', 'apc', 'council']}
    pageTitle="Meeting Minutes — HR Archive"
    pageSubtitle="View and print all uploaded meeting minutes across College Board, A&PC, and Council levels. Use the template buttons to download official templates for distribution. HR has read-only access."
  />
);

export default HRMinutesPage;
