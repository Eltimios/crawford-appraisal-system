import MinutesView from '../../components/minutes/MinutesView';

const DeanMinutesPage = () => (
  <MinutesView
    canUpload
    uploadType="college_board"
    viewTypes={['college_board']}
    pageTitle="College Board Meeting Minutes"
    pageSubtitle="Upload and manage official College Board meeting minutes for appraisal cycles. The system will cross-check entries against HOD assessment records and flag any discrepancies."
  />
);

export default DeanMinutesPage;
