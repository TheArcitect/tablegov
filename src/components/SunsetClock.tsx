import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';

export default function SunsetClock() {
  const { state, dispatch, audit } = useStore();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Check for expirations
  useEffect(() => {
    for (const charter of state.charters) {
      if (charter.status === 'active' && new Date(charter.sunsetDate).getTime() <= now) {
        dispatch({ type: 'EXPIRE_CHARTER', id: charter.id });
        audit('charter_expired', 'charter', charter.id, `Charter "${charter.organizationName}" expired — sunset reached`);
      }
    }
  }, [now, state.charters, dispatch, audit]);

  async function handleRenew(charterId: string, orgName: string) {
    const charter = state.charters.find((c) => c.id === charterId);
    if (!charter) return;
    const newSunset = new Date(Date.now() + 365 * 86400000).toISOString();
    dispatch({ type: 'RENEW_CHARTER', id: charterId, newSunsetDate: newSunset });
    await audit('sunset_renewed', 'sunset', charterId, `Sunset for "${orgName}" renewed for 365 days`);
  }

  function formatCountdown(ms: number): string {
    if (ms <= 0) return 'EXPIRED';
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  function getProgress(createdAt: string, sunsetDate: string): number {
    const start = new Date(createdAt).getTime();
    const end = new Date(sunsetDate).getTime();
    const total = end - start;
    const elapsed = now - start;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }

  if (state.charters.length === 0) {
    return (
      <div className="component-panel">
        <h2>Sunset Clock</h2>
        <p className="subtitle">
          Visual countdown attached to every charter. Public. Cannot be hidden.
          Default state is <strong>expired</strong>. Must be actively renewed.
        </p>
        <div className="empty-state">
          <p>No charters exist yet. Create a charter first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="component-panel">
      <h2>Sunset Clock</h2>
      <p className="subtitle">
        Every charter has a built-in expiration. Default state is <strong>expired</strong>.
        Power must re-declare its agenda at fixed intervals or expire.
      </p>

      <div className="sunset-grid">
        {state.charters.map((charter) => {
          const remaining = new Date(charter.sunsetDate).getTime() - now;
          const expired = remaining <= 0;
          const progress = getProgress(charter.createdAt, charter.sunsetDate);
          const urgency =
            remaining <= 0
              ? 'expired'
              : remaining < 30 * 86400000
                ? 'critical'
                : remaining < 90 * 86400000
                  ? 'warning'
                  : 'healthy';

          return (
            <div key={charter.id} className={`sunset-card sunset-${urgency}`}>
              <div className="sunset-header">
                <h3>{charter.organizationName}</h3>
                <span className={`status-badge status-${charter.status}`}>
                  {charter.status.toUpperCase()}
                </span>
              </div>

              <div className="countdown-display">
                <div className={`countdown-value countdown-${urgency}`}>
                  {formatCountdown(remaining)}
                </div>
                <div className="countdown-label">
                  {expired ? 'CHARTER EXPIRED — RENEWAL REQUIRED' : 'until sunset'}
                </div>
              </div>

              <div className="progress-bar-container">
                <div
                  className={`progress-bar progress-${urgency}`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="sunset-meta">
                <span>Sunset: {new Date(charter.sunsetDate).toLocaleDateString()}</span>
                <span>Renewals: {charter.renewalCount}</span>
              </div>

              <button
                className="btn-primary"
                onClick={() => handleRenew(charter.id, charter.organizationName)}
              >
                {expired ? 'Renew Charter (Reactivate)' : 'Renew Sunset (365 days)'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
