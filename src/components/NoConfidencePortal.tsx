import { useState } from 'react';
import { useStore } from '../store/useStore';
import { generateId } from '../utils/crypto';
import type { NoConfidencePetition } from '../types';

export default function NoConfidencePortal() {
  const { state, dispatch, audit } = useStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [threshold, setThreshold] = useState(25);
  const [signerName, setSignerName] = useState('');

  const activeCharter = state.selectedCharterId
    ? state.charters.find((c) => c.id === state.selectedCharterId)
    : null;

  const charterPetitions = state.petitions.filter(
    (p) => p.charterId === state.selectedCharterId
  );

  async function createPetition(e: React.FormEvent) {
    e.preventDefault();
    if (!state.selectedCharterId) return;

    const petition: NoConfidencePetition = {
      id: generateId(),
      charterId: state.selectedCharterId,
      title: title.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString(),
      signatures: [],
      thresholdPercent: threshold,
      totalStakeholders: Math.max(1, state.stakeholders.length),
      status: 'open',
    };

    dispatch({ type: 'ADD_PETITION', petition });
    await audit(
      'petition_created',
      'petition',
      petition.id,
      `No-confidence petition "${title}" created (threshold: ${threshold}%)`
    );
    setTitle('');
    setDescription('');
  }

  async function signPetition(petitionId: string) {
    if (!signerName.trim()) return;
    const petition = state.petitions.find((p) => p.id === petitionId);
    if (!petition) return;

    // Check if already signed
    const alreadySigned = petition.signatures.some(
      (s) => s.name.toLowerCase() === signerName.trim().toLowerCase()
    );
    if (alreadySigned) return;

    const signature = {
      stakeholderId: generateId(),
      name: signerName.trim(),
      timestamp: new Date().toISOString(),
    };

    dispatch({ type: 'SIGN_PETITION', petitionId, signature });

    const newCount = petition.signatures.length + 1;
    const pct = (newCount / petition.totalStakeholders) * 100;

    if (pct >= petition.thresholdPercent) {
      await audit(
        'petition_threshold_met',
        'petition',
        petitionId,
        `No-confidence threshold met for "${petition.title}" — governance review triggered (${newCount}/${petition.totalStakeholders})`
      );
    } else {
      await audit(
        'petition_signed',
        'petition',
        petitionId,
        `"${signerName}" signed petition "${petition.title}" (${newCount}/${petition.totalStakeholders})`
      );
    }
    setSignerName('');
  }

  async function resolvePetition(petitionId: string) {
    dispatch({ type: 'RESOLVE_PETITION', petitionId });
    const petition = state.petitions.find((p) => p.id === petitionId);
    await audit(
      'petition_resolved',
      'petition',
      petitionId,
      `Petition "${petition?.title}" resolved after governance review`
    );
  }

  return (
    <div className="component-panel">
      <h2>No-Confidence Portal</h2>
      <p className="subtitle">
        When stakeholders lose confidence in governance, they can force re-declaration.
        When the threshold is met, governance review is mandatory.
      </p>

      {!activeCharter ? (
        <div className="empty-state">
          <p>Select a charter from the dashboard to manage petitions.</p>
        </div>
      ) : (
        <>
          <div className="context-bar">
            <span>Charter: <strong>{activeCharter.organizationName}</strong></span>
            <span>Stakeholders: <strong>{state.stakeholders.length}</strong></span>
          </div>

          <form onSubmit={createPetition} className="petition-form">
            <h3>File New Petition</h3>
            <div className="form-group">
              <label htmlFor="petTitle">Petition Title</label>
              <input
                id="petTitle"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. System is no longer serving declared stakeholders"
              />
            </div>
            <div className="form-group">
              <label htmlFor="petDesc">Description</label>
              <textarea
                id="petDesc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                placeholder="Explain why governance review is needed."
              />
            </div>
            <div className="form-group">
              <label htmlFor="petThreshold">Threshold to Trigger Review (%)</label>
              <input
                id="petThreshold"
                type="number"
                min={1}
                max={100}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
              />
            </div>
            <button type="submit" className="btn-primary">File Petition</button>
          </form>

          {charterPetitions.length > 0 && (
            <div className="petitions-list">
              <h3>Active Petitions</h3>
              {charterPetitions.map((petition) => {
                const pct =
                  petition.totalStakeholders > 0
                    ? (petition.signatures.length / petition.totalStakeholders) * 100
                    : 0;
                const thresholdMet = pct >= petition.thresholdPercent;

                return (
                  <div
                    key={petition.id}
                    className={`petition-card ${thresholdMet ? 'petition-triggered' : ''} petition-${petition.status}`}
                  >
                    <div className="petition-header">
                      <h4>{petition.title}</h4>
                      <span className={`status-badge status-${petition.status}`}>
                        {petition.status === 'threshold-met'
                          ? 'REVIEW TRIGGERED'
                          : petition.status.toUpperCase()}
                      </span>
                    </div>
                    <p>{petition.description}</p>

                    <div className="petition-progress">
                      <div className="progress-bar-container">
                        <div
                          className={`progress-bar ${thresholdMet ? 'progress-critical' : 'progress-healthy'}`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                        <div
                          className="threshold-marker"
                          style={{ left: `${petition.thresholdPercent}%` }}
                          title={`Threshold: ${petition.thresholdPercent}%`}
                        />
                      </div>
                      <div className="petition-stats">
                        <span>
                          {petition.signatures.length} / {petition.totalStakeholders} signatures
                          ({pct.toFixed(1)}%)
                        </span>
                        <span>Threshold: {petition.thresholdPercent}%</span>
                      </div>
                    </div>

                    {petition.status === 'open' && (
                      <div className="sign-section">
                        <input
                          type="text"
                          placeholder="Your name to sign"
                          value={signerName}
                          onChange={(e) => setSignerName(e.target.value)}
                        />
                        <button
                          className="btn-secondary"
                          onClick={() => signPetition(petition.id)}
                        >
                          Sign Petition
                        </button>
                      </div>
                    )}

                    {petition.status === 'threshold-met' && (
                      <div className="review-alert">
                        <p>
                          <strong>Threshold met.</strong> Governance review is mandatory.
                          The system must re-declare its agenda.
                        </p>
                        <button
                          className="btn-primary"
                          onClick={() => resolvePetition(petition.id)}
                        >
                          Mark Review Complete
                        </button>
                      </div>
                    )}

                    {petition.signatures.length > 0 && (
                      <details className="signatures-list">
                        <summary>{petition.signatures.length} signature(s)</summary>
                        <ul>
                          {petition.signatures.map((s, i) => (
                            <li key={i}>
                              {s.name} — {new Date(s.timestamp).toLocaleString()}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
