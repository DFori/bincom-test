import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import { 
  Building2, 
  MapPin, 
  Layers, 
  Calendar, 
  User, 
  ArrowLeft, 
  Trophy, 
  Vote, 
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

export default function PollingUnitDetailPage() {
  const { uniqueid } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.getPollingUnitResults(uniqueid);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load polling unit election results');
    } finally {
      setLoading(false);
    }
  }, [uniqueid]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  if (loading) {
    return <LoadingSpinner message="Retrieving polling unit result data..." />;
  }

  if (error) {
    return (
      <div>
        <Link to="/polling-units" className="btn btn-secondary btn-sm" style={{ marginBottom: '1.5rem' }}>
          <ArrowLeft size={16} />
          <span>Back to Polling Units</span>
        </Link>
        <ErrorAlert message={error} onRetry={loadResults} />
      </div>
    );
  }

  const { pollingUnit, results = [], totalVotes = 0, winner } = data || {};

  return (
    <div>
      {/* Navigation Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <Link to="/polling-units" className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} />
          <span>Back to Polling Units</span>
        </Link>
        {pollingUnit?.lgaId && (
          <Link to={`/lga-results?lgaId=${pollingUnit.lgaId}`} className="btn btn-primary btn-sm">
            <span>View {pollingUnit.lgaName} LGA Aggregate</span>
            <ExternalLink size={14} />
          </Link>
        )}
      </div>

      {/* Polling Unit Profile Card */}
      <div className="card">
        <div className="card-header" style={{ marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="badge badge-primary">Unique ID #{pollingUnit?.uniqueId}</span>
              <span className="badge badge-slate">{pollingUnit?.pollingUnitNumber || 'DT-UNIT'}</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
              {pollingUnit?.pollingUnitName || 'Polling Unit'}
            </h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--slate-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Total Unit Votes
            </span>
            <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--primary)' }}>
              {totalVotes.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          padding: '1.25rem',
          background: '#f8fafc',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--slate-border)'
        }}>
          <div>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--slate-muted)', fontWeight: 600 }}>
              <MapPin size={14} /> Local Government Area
            </span>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--dark-navy)', marginTop: '0.2rem' }}>
              {pollingUnit?.lgaName}
            </div>
          </div>

          <div>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--slate-muted)', fontWeight: 600 }}>
              <Layers size={14} /> Ward Division
            </span>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--dark-navy)', marginTop: '0.2rem' }}>
              {pollingUnit?.wardName}
            </div>
          </div>

          <div>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--slate-muted)', fontWeight: 600 }}>
              <Building2 size={14} /> Coordinates
            </span>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--slate-dark)', marginTop: '0.2rem' }}>
              {pollingUnit?.lat && pollingUnit?.long ? `${pollingUnit.lat}, ${pollingUnit.long}` : 'Not Specified'}
            </div>
          </div>

          <div>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--slate-muted)', fontWeight: 600 }}>
              <Vote size={14} /> Description
            </span>
            <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--slate-dark)', marginTop: '0.2rem' }}>
              {pollingUnit?.description || 'No additional description provided.'}
            </div>
          </div>
        </div>
      </div>

      {/* Winner Spotlight if results exist */}
      {winner && (
        <div className="winner-spotlight">
          <div className="winner-spotlight-content">
            <div className="winner-trophy-icon">
              <Vote size={24} />
            </div>
            <div>
              <span className="winner-info-title">Station Lead</span>
              <h3 className="winner-party-name">
                {winner.partyName} ({winner.partyAbbreviation})
              </h3>
              <span style={{ fontSize: '0.825rem', color: '#047857' }}>
                Secured {winner.percentage}% of the total unit votes
              </span>
            </div>
          </div>
          <div>
            <div className="winner-stat-num">{Number(winner?.partyScore || 0).toLocaleString()}</div>
            <div style={{ fontSize: '0.8rem', color: '#065f46', textAlign: 'right', fontWeight: 600 }}>
              Votes Recorded
            </div>
          </div>
        </div>
      )}

      {/* Results Table Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <Vote size={20} color="var(--primary)" />
            <h2 className="card-title">Announced Election Results</h2>
          </div>
          <span className="badge badge-primary">
            Source: announced_pu_results
          </span>
        </div>

        {results.length === 0 ? (
          <EmptyState
            title="No Results Announced for this Polling Unit"
            description="The database currently has no announced scores recorded for this polling unit."
            action={
              <Link to="/new-result" className="btn btn-primary btn-sm">
                <span>Record Results for this Unit</span>
              </Link>
            }
          />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Rank</th>
                  <th>Party Code</th>
                  <th>Full Party Name</th>
                  <th style={{ textAlign: 'right' }}>Votes</th>
                  <th style={{ width: '35%' }}>Vote Percentage</th>
                  <th>Recorded By</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, index) => (
                  <tr key={r.resultId || r.partyAbbreviation} className={index === 0 ? 'winner-row' : ''}>
                    <td>
                      <span className={`rank-badge ${index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : ''}`}>
                        {r.rank || index + 1}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-primary" style={{ fontWeight: 700 }}>
                        {r.partyAbbreviation}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {r.partyName}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--dark-navy)' }}>
                      {Number(r.partyScore || 0).toLocaleString()}
                    </td>
                    <td>
                      <div className="vote-bar-container">
                        <div className="progress-track">
                          <div 
                            className={`progress-fill ${index === 0 ? 'winner' : ''}`}
                            style={{ width: `${Math.min(100, Math.max(2, r.percentage || 0))}%` }}
                          />
                        </div>
                        <span className="vote-pct-text">{r.percentage || 0}%</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--slate-muted)' }}>
                      {r.enteredByUser || 'Officer'}
                    </td>
                    <td style={{ fontSize: '0.825rem', color: 'var(--slate-muted)' }}>
                      {r.dateEntered ? new Date(r.dateEntered).toLocaleString() : '2011-04-26'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                  <td colSpan="3" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Total Accumulated Votes
                  </td>
                  <td style={{ textAlign: 'right', fontSize: '1.15rem', color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
                    {Number(totalVotes || 0).toLocaleString()}
                  </td>
                  <td colSpan="3" style={{ fontSize: '0.85rem', color: 'var(--slate-muted)' }}>
                    100.00% across {results.length} parties
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
