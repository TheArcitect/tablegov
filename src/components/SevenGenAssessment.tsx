import { useState } from 'react';
import { useStore } from '../store/useStore';
import { generateId } from '../utils/crypto';
import type { SevenGenAssessment as Assessment } from '../types';

const GENERATION_LABELS = [
  { key: 'generation1', label: 'Generation 1 — Current (Now)', years: 'Present' },
  { key: 'generation2', label: 'Generation 2 (~25 years)', years: '~2051' },
  { key: 'generation3', label: 'Generation 3 (~50 years)', years: '~2076' },
  { key: 'generation4', label: 'Generation 4 (~75 years)', years: '~2101' },
  { key: 'generation5', label: 'Generation 5 (~100 years)', years: '~2126' },
  { key: 'generation6', label: 'Generation 6 (~125 years)', years: '~2151' },
  { key: 'generation7', label: 'Generation 7 (~150+ years)', years: '~2176+' },
] as const;

export default function SevenGenAssessment() {
  const { state, dispatch, audit } = useStore();

  const activeCharter = state.selectedCharterId
    ? state.charters.find((c) => c.id === state.selectedCharterId)
    : null;

  const now = new Date();
  const defaultQuarter = `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`;

  const [quarter, setQuarter] = useState(defaultQuarter);
  const [systemDesc, setSystemDesc] = useState('');
  const [generations, setGenerations] = useState<Record<string, string>>({
    generation1: '',
    generation2: '',
    generation3: '',
    generation4: '',
    generation5: '',
    generation6: '',
    generation7: '',
  });
  const [overall, setOverall] = useState<Assessment['overallAssessment']>('acceptable');
  const [recommendations, setRecommendations] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function updateGen(key: string, value: string) {
    setGenerations((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state.selectedCharterId) return;

    const assessment: Assessment = {
      id: generateId(),
      charterId: state.selectedCharterId,
      createdAt: new Date().toISOString(),
      quarter,
      systemDescription: systemDesc,
      generation1: generations.generation1,
      generation2: generations.generation2,
      generation3: generations.generation3,
      generation4: generations.generation4,
      generation5: generations.generation5,
      generation6: generations.generation6,
      generation7: generations.generation7,
      overallAssessment: overall,
      recommendations,
    };

    dispatch({ type: 'ADD_ASSESSMENT', assessment });
    await audit(
      'assessment_created',
      'assessment',
      assessment.id,
      `Seven-generation assessment for ${quarter}: ${overall}`
    );
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

  const charterAssessments = state.assessments.filter(
    (a) => a.charterId === state.selectedCharterId
  );

  return (
    <div className="component-panel">
      <h2>Seven-Generation Assessment</h2>
      <p className="subtitle">
        Structured quarterly review: "Would this system's operation be acceptable to those
        affected seven generations from now?" Not rhetorical — formal evaluation.
      </p>

      {!activeCharter ? (
        <div className="empty-state">
          <p>Select a charter from the dashboard to run an assessment.</p>
        </div>
      ) : (
        <>
          <div className="context-bar">
            <span>Charter: <strong>{activeCharter.organizationName}</strong></span>
            <span>Quarter: <strong>{defaultQuarter}</strong></span>
          </div>

          <form onSubmit={handleSubmit} className="assessment-form">
            <div className="form-group">
              <label htmlFor="assessQuarter">Assessment Quarter</label>
              <input
                id="assessQuarter"
                type="text"
                value={quarter}
                onChange={(e) => setQuarter(e.target.value)}
                placeholder="e.g. 2026-Q1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="sysDesc">System Description (current state)</label>
              <textarea
                id="sysDesc"
                value={systemDesc}
                onChange={(e) => setSystemDesc(e.target.value)}
                required
                rows={3}
                placeholder="Describe what the system currently does and how it operates."
              />
            </div>

            <div className="generations-grid">
              {GENERATION_LABELS.map(({ key, label, years }) => (
                <div key={key} className="generation-field">
                  <label htmlFor={key}>
                    {label} <span className="year-hint">{years}</span>
                  </label>
                  <textarea
                    id={key}
                    value={generations[key]}
                    onChange={(e) => updateGen(key, e.target.value)}
                    required
                    rows={3}
                    placeholder={`What impact would this system have on people living in ${years}?`}
                  />
                </div>
              ))}
            </div>

            <div className="form-group">
              <label htmlFor="overallAssess">Overall Assessment</label>
              <select
                id="overallAssess"
                value={overall}
                onChange={(e) => setOverall(e.target.value as Assessment['overallAssessment'])}
              >
                <option value="acceptable">Acceptable — system passes seven-generation test</option>
                <option value="concerning">Concerning — modifications recommended</option>
                <option value="unacceptable">Unacceptable — system fails seven-generation test</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="recs">Recommendations</label>
              <textarea
                id="recs"
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                required
                rows={3}
                placeholder="What changes would make this system acceptable across all seven generations?"
              />
            </div>

            <button type="submit" className="btn-primary">Submit Assessment</button>
            {submitted && <span className="save-indicator">Assessment recorded</span>}
          </form>

          {charterAssessments.length > 0 && (
            <div className="assessment-history">
              <h3>Previous Assessments</h3>
              {charterAssessments
                .slice()
                .reverse()
                .map((a) => (
                  <div key={a.id} className={`assessment-card assessment-${a.overallAssessment}`}>
                    <div className="assessment-header">
                      <h4>{a.quarter}</h4>
                      <span className={`assessment-badge assessment-badge-${a.overallAssessment}`}>
                        {a.overallAssessment.toUpperCase()}
                      </span>
                    </div>
                    <p className="assessment-desc">{a.systemDescription}</p>
                    <details>
                      <summary>View generational analysis</summary>
                      <div className="gen-details">
                        {GENERATION_LABELS.map(({ key, label }) => (
                          <div key={key}>
                            <strong>{label}:</strong>
                            <p>{a[key as keyof Assessment] as string}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                    <p className="recs"><strong>Recommendations:</strong> {a.recommendations}</p>
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
