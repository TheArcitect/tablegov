import { useReducer, useCallback } from 'react';
import {
  reducer,
  initialState,
  loadPersistedState,
  createAuditEntry,
  StoreContext,
} from './store/useStore';
import type { AuditEntry, AuditAction, View } from './types';
import Dashboard from './components/Dashboard';
import CharterGenerator from './components/CharterGenerator';
import SunsetClock from './components/SunsetClock';
import SortitionEngine from './components/SortitionEngine';
import NoConfidencePortal from './components/NoConfidencePortal';
import SevenGenAssessment from './components/SevenGenAssessment';
import AuditTrail from './components/AuditTrail';

const NAV_ITEMS: { view: View; label: string; icon: string }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: '///' },
  { view: 'charter', label: 'Charter', icon: 'DOC' },
  { view: 'sunset', label: 'Sunset Clock', icon: 'CLK' },
  { view: 'sortition', label: 'Sortition', icon: 'LOT' },
  { view: 'no-confidence', label: 'No-Confidence', icon: 'PET' },
  { view: 'seven-gen', label: 'Seven-Gen', icon: '7GN' },
  { view: 'audit', label: 'Audit Trail', icon: 'LOG' },
];

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState, () => {
    return loadPersistedState() || initialState;
  });

  const audit = useCallback(
    async (
      action: AuditAction,
      entityType: AuditEntry['entityType'],
      entityId: string,
      description: string
    ) => {
      const prevHash =
        state.auditLog.length > 0
          ? state.auditLog[state.auditLog.length - 1].hash
          : '0'.repeat(64);
      const entry = await createAuditEntry(action, entityType, entityId, description, prevHash);
      dispatch({ type: 'ADD_AUDIT_ENTRY', entry });
    },
    [state.auditLog]
  );

  function renderView() {
    switch (state.currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'charter':
        return <CharterGenerator />;
      case 'sunset':
        return <SunsetClock />;
      case 'sortition':
        return <SortitionEngine />;
      case 'no-confidence':
        return <NoConfidencePortal />;
      case 'seven-gen':
        return <SevenGenAssessment />;
      case 'audit':
        return <AuditTrail />;
    }
  }

  return (
    <StoreContext.Provider value={{ state, dispatch, audit }}>
      <div className="app">
        <header className="app-header">
          <div className="logo" onClick={() => dispatch({ type: 'SET_VIEW', view: 'dashboard' })}>
            <span className="logo-mark">TG</span>
            <span className="logo-text">TableGov</span>
          </div>
          <span className="tagline">Governance Infrastructure</span>
        </header>

        <div className="app-body">
          <nav className="sidebar">
            {NAV_ITEMS.map(({ view, label, icon }) => (
              <button
                key={view}
                className={`nav-item ${state.currentView === view ? 'nav-active' : ''}`}
                onClick={() => dispatch({ type: 'SET_VIEW', view })}
              >
                <span className="nav-icon">{icon}</span>
                <span className="nav-label">{label}</span>
              </button>
            ))}
          </nav>

          <main className="main-content">{renderView()}</main>
        </div>
      </div>
    </StoreContext.Provider>
  );
}
