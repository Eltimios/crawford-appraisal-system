import MinutesView from '../../components/minutes/MinutesView';

const APCMinutesPage = () => (
  <MinutesView
    canUpload
    uploadType="apc"
    viewTypes={['apc']}
    pageTitle="A&PC Meeting Minutes"
    pageSubtitle="Upload and manage official A&PC committee meeting minutes. The system will cross-check extracted recommendations against appraisal decisions recorded in the system."
  />
);

export default APCMinutesPage;
