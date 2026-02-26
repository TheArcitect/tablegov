import { useStore } from '../store/useStore';
import type { View } from '../types';

export default function Dashboard() {
  const { state, dispatch } = useStore();

  const activeCharters = state.charters.filter((c) => c.status === 'active').length;
  const expiredCharters = state.charters.filter((c) => c.status === 'expired').length;
  const openPetitions = state.petitions.filter(
    (p) => p.status === 'open' || p.status === 'threshold-met'
  ).length;
  const triggeredPetitions = state.petitions.filter(
    (p) => p.status === 'threshold-met'
  ).length;

  function navigate(view: View, charterId?: string) {
    if (charterId) dispatch({ type: 'SELECT_CHARTER', id: charterId });
    dispatch({ type: 'SET_VIEW', view });
  }

  return (
    <div className="component-panel dashboard">
      <div className="dashboard-header">
        <h2>TableGov Dashboard</h2>
        <p className="subtitle">
          Governance infrastructure for any system that wields power.
          The operating system underneath all of them.
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('charter')}>
          <div className="stat-value">{state.charters.length}</div>
          <div className="stat-label">Charters</div>
          <div className="stat-detail">
            {activeCharters} active, {expiredCharters} expired
          </div>
        </div>
        <div className="stat-card" onClick={() => navigate('sunset')}>
          <div className="stat-value stat-warning">{expiredCharters}</div>
          <div className="stat-label">Expired (Need Renewal)</div>
          <div className="stat-detail">Default state is expired</div>
        </div>
        <div className="stat-card" onClick={() => navigate('sortition')}>
          <div className="stat-value">{state.stakeholders.length}</div>
          <div className="stat-label">Stakeholders</div>
          <div className="stat-detail">{state.sortitionResults.length} sortitions run</div>
        </div>
        <div
          className={`stat-card ${triggeredPetitions > 0 ? 'stat-card-alert' : ''}`}
          onClick={() => navigate('no-confidence')}
        >
          <div className="stat-value">{openPetitions}</div>
          <div className="stat-label">Open Petitions</div>
          <div className="stat-detail">
            {triggeredPetitions > 0
              ? `${triggeredPetitions} THRESHOLD MET — REVIEW REQUIRED`
              : 'No thresholds triggered'}
          </div>
        </div>
        <div className="stat-card" onClick={() => navigate('seven-gen')}>
          <div className="stat-value">{state.assessments.length}</div>
          <div className="stat-label">Assessments</div>
          <div className="stat-detail">Seven-generation reviews</div>
        </div>
        <div className="stat-card" onClick={() => navigate('audit')}>
          <div className="stat-value">{state.auditLog.length}</div>
          <div className="stat-label">Audit Entries</div>
          <div className="stat-detail">Immutable governance log</div>
        </div>
      </div>

      {state.charters.length > 0 && (
        <div className="charter-list-section">
          <h3>Charters</h3>
          <div className="charter-list">
            {state.charters.map((charter) => {
              const remaining = new Date(charter.sunsetDate).getTime() - Date.now();
              const daysLeft = Math.ceil(remaining / 86400000);

              return (
                <div
                  key={charter.id}
                  className={`charter-list-item ${state.selectedCharterId === charter.id ? 'selected' : ''}`}
                  onClick={() => dispatch({ type: 'SELECT_CHARTER', id: charter.id })}
                >
                  <div className="charter-list-name">
                    <span className={`dot dot-${charter.status}`} />
                    {charter.organizationName}
                  </div>
                  <div className="charter-list-meta">
                    <span className={`status-badge status-${charter.status}`}>
                      {charter.status}
                    </span>
                    <span className={daysLeft <= 30 ? 'text-danger' : ''}>
                      {daysLeft <= 0 ? 'EXPIRED' : `${daysLeft} days left`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {state.charters.length === 0 && (
        <div className="getting-started">
          <h3>Getting Started</h3>
          <p>
            Every system that wields power needs a governance charter. Start by creating one.
          </p>
          <button className="btn-primary" onClick={() => navigate('charter')}>
            Create First Charter
          </button>
        </div>
      )}
    </div>
  );
}
