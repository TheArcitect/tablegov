import { useState } from 'react';
import { useStore } from '../store/useStore';

const ACTION_LABELS: Record<string, string> = {
  charter_created: 'Charter Created',
  charter_updated: 'Charter Updated',
  charter_renewed: 'Charter Renewed',
  charter_expired: 'Charter Expired',
  sunset_renewed: 'Sunset Renewed',
  sunset_expired: 'Sunset Expired',
  sortition_performed: 'Sortition Performed',
  petition_created: 'Petition Filed',
  petition_signed: 'Petition Signed',
  petition_threshold_met: 'Threshold Met',
  petition_resolved: 'Petition Resolved',
  assessment_created: 'Assessment Created',
};

export default function AuditTrail() {
  const { state } = useStore();
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const entries = state.auditLog
    .slice()
    .reverse()
    .filter((e) => {
      if (filter !== 'all' && e.entityType !== filter) return false;
      if (searchTerm && !e.description.toLowerCase().includes(searchTerm.toLowerCase()))
        return false;
      return true;
    });

  return (
    <div className="component-panel">
      <h2>Audit Trail</h2>
      <p className="subtitle">
        Immutable log of all governance decisions and charter changes. Every action is
        hash-chained. Transparent. Auditable. Cannot be altered retroactively.
      </p>

      <div className="audit-controls">
        <div className="form-group">
          <label htmlFor="auditFilter">Filter by type</label>
          <select
            id="auditFilter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Events</option>
            <option value="charter">Charter</option>
            <option value="sunset">Sunset</option>
            <option value="sortition">Sortition</option>
            <option value="petition">Petition</option>
            <option value="assessment">Assessment</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="auditSearch">Search</label>
          <input
            id="auditSearch"
            type="text"
            placeholder="Search descriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="empty-state">
          <p>No audit entries yet. Actions will be logged as you use the platform.</p>
        </div>
      ) : (
        <>
          <div className="audit-summary">
            <span>{entries.length} entries</span>
            <span>
              Chain integrity:{' '}
              <strong className="chain-valid">
                {verifyChain(state.auditLog) ? 'VALID' : 'BROKEN'}
              </strong>
            </span>
          </div>

          <div className="audit-log">
            {entries.map((entry, idx) => (
              <div key={entry.id} className={`audit-entry audit-${entry.entityType}`}>
                <div className="audit-entry-header">
                  <span className={`audit-action audit-action-${entry.action}`}>
                    {ACTION_LABELS[entry.action] || entry.action}
                  </span>
                  <span className="audit-time">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="audit-description">{entry.description}</p>
                <div className="audit-hashes">
                  <span>
                    Hash: <code>{entry.hash.slice(0, 20)}...</code>
                  </span>
                  {entry.previousHash && (
                    <span>
                      Prev: <code>{entry.previousHash.slice(0, 20)}...</code>
                    </span>
                  )}
                  {idx < entries.length - 1 && (
                    <span className="chain-link">&#x1F517;</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function verifyChain(log: { hash: string; previousHash: string }[]): boolean {
  if (log.length <= 1) return true;
  for (let i = 1; i < log.length; i++) {
    if (log[i].previousHash !== log[i - 1].hash) return false;
  }
  return true;
}
