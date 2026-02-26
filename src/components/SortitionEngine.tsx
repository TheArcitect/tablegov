import { useState } from 'react';
import { useStore } from '../store/useStore';
import { generateId, getCryptoSeed, seededShuffle, sha256 } from '../utils/crypto';
import type { Stakeholder, SortitionResult } from '../types';

export default function SortitionEngine() {
  const { state, dispatch, audit } = useStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [stratum, setStratum] = useState('');
  const [selectionSize, setSelectionSize] = useState(3);
  const [useStratification, setUseStratification] = useState(false);
  const [lastResult, setLastResult] = useState<SortitionResult | null>(null);

  async function addStakeholder(e: React.FormEvent) {
    e.preventDefault();
    const stakeholder: Stakeholder = {
      id: generateId(),
      name: name.trim(),
      email: email.trim(),
      stratum: stratum.trim() || undefined,
      addedAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_STAKEHOLDER', stakeholder });
    setName('');
    setEmail('');
    setStratum('');
  }

  async function runSortition() {
    if (state.stakeholders.length === 0 || selectionSize < 1) return;

    const seed = getCryptoSeed();
    const size = Math.min(selectionSize, state.stakeholders.length);
    let selectedIds: string[];
    let stratification: Record<string, number> | undefined;

    if (useStratification) {
      // Group by stratum
      const groups: Record<string, Stakeholder[]> = {};
      for (const s of state.stakeholders) {
        const key = s.stratum || 'unstratified';
        if (!groups[key]) groups[key] = [];
        groups[key].push(s);
      }

      // Proportional allocation
      const strata = Object.keys(groups);
      const total = state.stakeholders.length;
      selectedIds = [];
      stratification = {};

      let remaining = size;
      for (let i = 0; i < strata.length; i++) {
        const key = strata[i];
        const groupSize = groups[key].length;
        const allocation =
          i === strata.length - 1
            ? remaining
            : Math.max(1, Math.round((groupSize / total) * size));
        const actual = Math.min(allocation, groupSize, remaining);

        const shuffled = seededShuffle(groups[key], seed + key);
        for (let j = 0; j < actual; j++) {
          selectedIds.push(shuffled[j].id);
        }
        stratification[key] = actual;
        remaining -= actual;
        if (remaining <= 0) break;
      }
    } else {
      const shuffled = seededShuffle(state.stakeholders, seed);
      selectedIds = shuffled.slice(0, size).map((s) => s.id);
    }

    const resultData = {
      seed,
      selectedIds,
      poolSize: state.stakeholders.length,
      selectionSize: size,
      timestamp: new Date().toISOString(),
    };
    const verificationHash = await sha256(JSON.stringify(resultData));

    const result: SortitionResult = {
      id: generateId(),
      charterId: state.selectedCharterId || '',
      timestamp: resultData.timestamp,
      selectedIds,
      poolSize: state.stakeholders.length,
      selectionSize: size,
      seed,
      stratification,
      verificationHash,
    };

    dispatch({ type: 'ADD_SORTITION_RESULT', result });
    setLastResult(result);
    await audit(
      'sortition_performed',
      'sortition',
      result.id,
      `Sortition: ${size} selected from ${state.stakeholders.length} stakeholders (seed: ${seed.slice(0, 12)}...)`
    );
  }

  function getStakeholderName(id: string): string {
    return state.stakeholders.find((s) => s.id === id)?.name ?? 'Unknown';
  }

  // Unique strata
  const strata = [...new Set(state.stakeholders.map((s) => s.stratum).filter(Boolean))];

  return (
    <div className="component-panel">
      <h2>Sortition Engine</h2>
      <p className="subtitle">
        Lottery selection from a stakeholder list. Random selection eliminates systematic bias
        from the selection process itself. Cryptographically verifiable.
      </p>

      <div className="two-column">
        <div>
          <h3>Stakeholder Pool ({state.stakeholders.length})</h3>
          <form onSubmit={addStakeholder} className="inline-form">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Stratum (optional)"
              value={stratum}
              onChange={(e) => setStratum(e.target.value)}
            />
            <button type="submit" className="btn-secondary">Add</button>
          </form>

          {state.stakeholders.length > 0 && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Stratum</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {state.stakeholders.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.email}</td>
                    <td>{s.stratum || '—'}</td>
                    <td>
                      <button
                        className="btn-remove"
                        onClick={() => dispatch({ type: 'REMOVE_STAKEHOLDER', id: s.id })}
                      >
                        &times;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div>
          <h3>Run Lottery</h3>
          <div className="form-group">
            <label htmlFor="selSize">Number to Select</label>
            <input
              id="selSize"
              type="number"
              min={1}
              max={state.stakeholders.length || 1}
              value={selectionSize}
              onChange={(e) => setSelectionSize(Number(e.target.value))}
            />
          </div>

          {strata.length > 0 && (
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={useStratification}
                  onChange={(e) => setUseStratification(e.target.checked)}
                />
                Enable stratification ({strata.length} strata: {strata.join(', ')})
              </label>
            </div>
          )}

          <button
            className="btn-primary"
            onClick={runSortition}
            disabled={state.stakeholders.length === 0}
          >
            Run Sortition
          </button>

          {lastResult && (
            <div className="result-card">
              <h4>Selection Result</h4>
              <div className="result-meta">
                <span>Pool: {lastResult.poolSize}</span>
                <span>Selected: {lastResult.selectionSize}</span>
                <span>Time: {new Date(lastResult.timestamp).toLocaleString()}</span>
              </div>
              <ul className="selected-list">
                {lastResult.selectedIds.map((id) => (
                  <li key={id}>{getStakeholderName(id)}</li>
                ))}
              </ul>
              {lastResult.stratification && (
                <div className="stratification-info">
                  <strong>Stratification:</strong>
                  {Object.entries(lastResult.stratification).map(([k, v]) => (
                    <span key={k} className="strata-badge">
                      {k}: {v}
                    </span>
                  ))}
                </div>
              )}
              <div className="crypto-info">
                <div>
                  <strong>Seed:</strong>
                  <code>{lastResult.seed}</code>
                </div>
                <div>
                  <strong>Verification Hash:</strong>
                  <code>{lastResult.verificationHash}</code>
                </div>
              </div>
            </div>
          )}

          {state.sortitionResults.length > 1 && (
            <div className="history-section">
              <h4>Previous Sortitions ({state.sortitionResults.length})</h4>
              {state.sortitionResults
                .slice()
                .reverse()
                .slice(0, 5)
                .map((r) => (
                  <div key={r.id} className="history-item">
                    <span>{new Date(r.timestamp).toLocaleString()}</span>
                    <span>
                      {r.selectionSize}/{r.poolSize} selected
                    </span>
                    <code className="small">{r.verificationHash.slice(0, 16)}...</code>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
