import { useState, useEffect } from 'react';
import { getApprovedCollegeBoardReviews } from '../../services/appraisalService';

const ApprovedPage = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getApprovedCollegeBoardReviews()
      .then(data => setList(data))
      .catch(err => console.error('CB approved error:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      <div className="page-header animate-fade-in">
        <h1 className="page-title">Approved Reviews</h1>
        <p className="page-subtitle">Academic staff assessments you have approved this session.</p>
      </div>

      <div className="card animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            Approved Assessments
            {list.length > 0 && (
              <span className="badge badge-success" style={{ marginLeft: '0.75rem' }}>{list.length}</span>
            )}
          </h3>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : list.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">—</div>
            <div className="empty-state-title">No approved reviews yet</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Assessments you approve from the Review Queue will appear here.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Staff Name</th>
                  <th>Department</th>
                  <th>Rank</th>
                  <th>HOD Grade</th>
                  <th>Approved On</th>
                  <th>Staff Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                      {a.part1?.surname} {a.part1?.firstName}
                    </td>
                    <td>{a.part1?.department || '—'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {a.part1?.rank || '—'}
                    </td>
                    <td>
                      {a.hodAssessment?.overallGrade
                        ? <span className="badge badge-primary">{a.hodAssessment.overallGrade}</span>
                        : '—'}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {a.hodAssessment?.submittedAt
                        ? new Date(a.hodAssessment.submittedAt).toLocaleDateString('en-NG')
                        : '—'}
                    </td>
                    <td>
                      {['completed', 'resolved'].includes(a.status)
                        ? <span className="badge badge-success">Completed</span>
                        : a.status === 'disputed'
                          ? <span className="badge badge-warning">Invalidated</span>
                          : <span className="badge badge-secondary">Pending Staff Review</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovedPage;
