import MinutesView from '../../components/minutes/MinutesView';

const CouncilMinutesPage = () => (
  <MinutesView
    canUpload
    uploadType="council"
    viewTypes={['college_board', 'apc', 'council']}
    pageTitle="Meeting Minutes — Full Record"
    pageSubtitle="Upload Council meeting minutes and review all minutes across College Board, A&PC, and Council levels. The system flags any discrepancies between uploaded minutes and recorded decisions — these are advisory warnings only."
  />
);

export default CouncilMinutesPage;
