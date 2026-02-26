import { useState } from 'react';
import { useStore } from '../store/useStore';
import { generateId } from '../utils/crypto';
import type { Charter } from '../types';

export default function CharterGenerator() {
  const { state, dispatch, audit } = useStore();

  const editing = state.selectedCharterId
    ? state.charters.find((c) => c.id === state.selectedCharterId) ?? null
    : null;

  const [orgName, setOrgName] = useState(editing?.organizationName ?? '');
  const [optimizesFor, setOptimizesFor] = useState(editing?.optimizesFor ?? '');
  const [serves, setServes] = useState(editing?.serves ?? '');
  const [powerWielded, setPowerWielded] = useState(editing?.powerWielded ?? '');
  const [powerChecks, setPowerChecks] = useState(editing?.powerChecks ?? '');
  const [clauses, setClauses] = useState<string[]>(editing?.additionalClauses ?? []);
  const [newClause, setNewClause] = useState('');
  const [sunsetDays, setSunsetDays] = useState(365);
  const [saved, setSaved] = useState(false);

  function addClause() {
    if (newClause.trim()) {
      setClauses([...clauses, newClause.trim()]);
      setNewClause('');
    }
  }

  function removeClause(idx: number) {
    setClauses(clauses.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const now = new Date().toISOString();
    const sunset = new Date(Date.now() + sunsetDays * 86400000).toISOString();

    if (editing) {
      const updated: Charter = {
        ...editing,
        organizationName: orgName,
        optimizesFor,
        serves,
        powerWielded,
        powerChecks,
        additionalClauses: clauses,
        updatedAt: now,
        sunsetDate: sunset,
      };
      dispatch({ type: 'UPDATE_CHARTER', charter: updated });
      await audit('charter_updated', 'charter', updated.id, `Charter "${orgName}" updated`);
    } else {
      const charter: Charter = {
        id: generateId(),
        organizationName: orgName,
        createdAt: now,
        updatedAt: now,
        optimizesFor,
        serves,
        powerWielded,
        powerChecks,
        additionalClauses: clauses,
        status: 'active',
        sunsetDate: sunset,
        renewalCount: 0,
      };
      dispatch({ type: 'ADD_CHARTER', charter });
      dispatch({ type: 'SELECT_CHARTER', id: charter.id });
      await audit('charter_created', 'charter', charter.id, `Charter "${orgName}" created with ${sunsetDays}-day sunset`);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  // Public charter document view
  const selectedCharter = state.selectedCharterId
    ? state.charters.find((c) => c.id === state.selectedCharterId)
    : null;

  return (
    <div className="component-panel">
      <h2>Governance Charter Generator</h2>
      <p className="subtitle">
        Declare what your organization optimizes for, who it serves, what power it wields,
        and how that power is checked. The output is a public charter document.
      </p>

      <form onSubmit={handleSubmit} className="charter-form">
        <div className="form-group">
          <label htmlFor="orgName">Organization / System Name</label>
          <input
            id="orgName"
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
            placeholder="e.g. ClearSignal, City Council AI Board"
          />
        </div>

        <div className="form-group">
          <label htmlFor="optimizesFor">What does this system optimize for?</label>
          <textarea
            id="optimizesFor"
            value={optimizesFor}
            onChange={(e) => setOptimizesFor(e.target.value)}
            required
            rows={3}
            placeholder="State the declared optimization target. Be specific."
          />
        </div>

        <div className="form-group">
          <label htmlFor="serves">Who does this system serve?</label>
          <textarea
            id="serves"
            value={serves}
            onChange={(e) => setServes(e.target.value)}
            required
            rows={3}
            placeholder="Identify the stakeholders this system exists to serve."
          />
        </div>

        <div className="form-group">
          <label htmlFor="powerWielded">What power does this system wield?</label>
          <textarea
            id="powerWielded"
            value={powerWielded}
            onChange={(e) => setPowerWielded(e.target.value)}
            required
            rows={3}
            placeholder="Describe the power this system exercises. Over whom? Through what mechanisms?"
          />
        </div>

        <div className="form-group">
          <label htmlFor="powerChecks">How is that power checked?</label>
          <textarea
            id="powerChecks"
            value={powerChecks}
            onChange={(e) => setPowerChecks(e.target.value)}
            required
            rows={3}
            placeholder="What mechanisms constrain this power? Who can revoke it? How?"
          />
        </div>

        <div className="form-group">
          <label htmlFor="sunsetDays">Sunset Duration (days)</label>
          <input
            id="sunsetDays"
            type="number"
            min={1}
            max={3650}
            value={sunsetDays}
            onChange={(e) => setSunsetDays(Number(e.target.value))}
          />
          <span className="hint">
            Default state is expired. Charter must be actively renewed before this deadline.
          </span>
        </div>

        <div className="form-group">
          <label>Additional Constitutional Clauses</label>
          <div className="clause-input">
            <input
              type="text"
              value={newClause}
              onChange={(e) => setNewClause(e.target.value)}
              placeholder="e.g. User data never sold. Never."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addClause();
                }
              }}
            />
            <button type="button" onClick={addClause} className="btn-secondary">
              Add
            </button>
          </div>
          {clauses.length > 0 && (
            <ul className="clause-list">
              {clauses.map((c, i) => (
                <li key={i}>
                  <span>{c}</span>
                  <button type="button" className="btn-remove" onClick={() => removeClause(i)}>
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button type="submit" className="btn-primary">
          {editing ? 'Update Charter' : 'Generate Charter'}
        </button>
        {saved && <span className="save-indicator">Saved and logged to audit trail</span>}
      </form>

      {selectedCharter && (
        <div className="charter-document">
          <h3>Public Charter Document</h3>
          <div className="charter-card">
            <div className="charter-header">
              <h4>{selectedCharter.organizationName}</h4>
              <span className={`status-badge status-${selectedCharter.status}`}>
                {selectedCharter.status.toUpperCase()}
              </span>
            </div>
            <div className="charter-field">
              <strong>Optimizes For:</strong>
              <p>{selectedCharter.optimizesFor}</p>
            </div>
            <div className="charter-field">
              <strong>Serves:</strong>
              <p>{selectedCharter.serves}</p>
            </div>
            <div className="charter-field">
              <strong>Power Wielded:</strong>
              <p>{selectedCharter.powerWielded}</p>
            </div>
            <div className="charter-field">
              <strong>Power Checks:</strong>
              <p>{selectedCharter.powerChecks}</p>
            </div>
            {selectedCharter.additionalClauses.length > 0 && (
              <div className="charter-field">
                <strong>Constitutional Clauses:</strong>
                <ul>
                  {selectedCharter.additionalClauses.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="charter-meta">
              <span>Created: {new Date(selectedCharter.createdAt).toLocaleDateString()}</span>
              <span>Sunset: {new Date(selectedCharter.sunsetDate).toLocaleDateString()}</span>
              <span>Renewals: {selectedCharter.renewalCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
