import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import { 
  Vote, 
  MapPin, 
  Building2, 
  Trophy, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  CheckCircle2,
  ExternalLink,
  Layers
} from 'lucide-react';

export default function LgaResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [lgas, setLgas] = useState([]);
  const [selectedLgaId, setSelectedLgaId] = useState(searchParams.get('lgaId') || '');
  
  const [lgaData, setLgaData] = useState(null);
  const [loadingLgas, setLoadingLgas] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState(null);
  
  // Verification accordion state
  const [showVerification, setShowVerification] = useState(false);

  // 1. Fetch Delta LGAs
  useEffect(() => {
    async function loadLgas() {
      try {
        setLoadingLgas(true);
        const lgaList = await apiClient.getDeltaLgas();
        setLgas(lgaList);
        
        // If no LGA is in searchParams, default to first LGA in Delta State
        if (!selectedLgaId && lgaList.length > 0) {
          // Default to Ughelli North (19) or first available
          const defaultLga = lgaList.find(l => l.lgaId === 19) || lgaList[0];
          setSelectedLgaId(String(defaultLga.lgaId));
          setSearchParams({ lgaId: String(defaultLga.lgaId) });
        }
      } catch (err) {
        setError(err.message || 'Failed to load Delta State LGAs');
      } finally {
        setLoadingLgas(false);
      }
    }
    loadLgas();
  }, []);

  // 2. Fetch Calculated Results for Selected LGA
  const fetchLgaResults = useCallback(async (lgaIdToFetch) => {
    if (!lgaIdToFetch) return;
    try {
      setLoadingResults(true);
      setError(null);
      // Fetch results including underlying polling unit breakdown for verification
      const data = await apiClient.getCalculatedLgaResults(lgaIdToFetch, true);
      setLgaData(data);
    } catch (err) {
      setError(err.message || 'Failed to calculate LGA election results');
    } finally {
      setLoadingResults(false);
    }
  }, []);

  useEffect(() => {
    if (selectedLgaId) {
      fetchLgaResults(selectedLgaId);
    }
  }, [selectedLgaId, fetchLgaResults]);

  // Handle LGA selection change
  const handleLgaChange = (e) => {
    const newLgaId = e.target.value;
    setSelectedLgaId(newLgaId);
    setSearchParams({ lgaId: newLgaId });
  };

  if (loadingLgas) {
    return <LoadingSpinner message="Loading Delta State LGAs..." />;
  }

  const { lga, pollingUnitsCount = 0, pollingUnitsWithResults = 0, totalVotes = 0, results = [], winner, breakdown = [] } = lgaData || {};

  return (
    <div>
      {/* Page Title & Selector Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <span className="badge badge-primary">Dynamic Aggregation Engine</span>
          <span className="badge badge-success">Delta State (state_id = 25)</span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--dark-navy)', marginBottom: '0.5rem' }}>
          Calculated Local Government Results
        </h1>
        <p style={{ color: 'var(--slate-muted)', fontSize: '1rem', maxWidth: '820px' }}>
          Real-time aggregated results calculated bottom-up from individual polling unit scores. Pre-announced LGA summaries are excluded to ensure mathematical authenticity.
        </p>
      </div>

      {/* LGA Selector Card */}
      <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.25rem' }}>
          <div>
            <label htmlFor="lga-select" className="form-label" style={{ fontSize: '0.95rem', color: 'var(--dark-navy)' }}>
              Select Delta State Local Government Area:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <select
                id="lga-select"
                className="select-control"
                value={selectedLgaId}
                onChange={handleLgaChange}
                style={{ fontSize: '1.05rem', fontWeight: 600, minWidth: '280px', borderColor: 'var(--primary)' }}
              >
                {lgas.map(l => (
                  <option key={l.lgaId} value={l.lgaId}>
                    {l.name} (LGA #{l.lgaId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to={`/polling-units?lgaId=${selectedLgaId}`} className="btn btn-secondary btn-sm">
              <Building2 size={15} />
              <span>Browse {lga?.name || 'LGA'} Polling Units</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && <ErrorAlert message={error} onRetry={() => fetchLgaResults(selectedLgaId)} />}

      {/* Results Section */}
      {loadingResults ? (
        <LoadingSpinner message={`Calculating live election totals for ${lgas.find(l => String(l.lgaId) === selectedLgaId)?.name || 'LGA'}...`} />
      ) : lgaData ? (
        <>
          {/* LGA Summary Metric Cards */}
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">Selected LGA</span>
                <div className="stat-icon-wrapper icon-blue">
                  <MapPin size={22} />
                </div>
              </div>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>{lga?.name}</div>
              <div className="stat-hint">Delta State LGA #{lga?.lgaId}</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">Polling Units Included</span>
                <div className="stat-icon-wrapper icon-indigo">
                  <Building2 size={22} />
                </div>
              </div>
              <div className="stat-value">{pollingUnitsWithResults} <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 500 }}>/ {pollingUnitsCount} registered</span></div>
              <div className="stat-hint">Units with recorded returns</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">Calculated Total Votes</span>
                <div className="stat-icon-wrapper icon-amber">
                  <Vote size={22} />
                </div>
              </div>
              <div className="stat-value">{totalVotes.toLocaleString()}</div>
              <div className="stat-hint">Sum of all polling unit ballots</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">LGA Winning Party</span>
                <div className="stat-icon-wrapper icon-emerald">
                  <Trophy size={22} />
                </div>
              </div>
              <div className="stat-value" style={{ color: winner ? '#065f46' : 'var(--dark-navy)' }}>
                {winner ? winner.partyAbbreviation : '—'}
              </div>
              <div className="stat-hint">{winner ? `${winner.percentage}% of LGA votes` : 'Pending returns'}</div>
            </div>
          </div>

          {/* Winner Spotlight */}
          {winner && (
            <div className="winner-spotlight">
              <div className="winner-spotlight-content">
                <div className="winner-trophy-icon">
                  <Vote size={24} />
                </div>
                <div>
                  <span className="winner-info-title">LGA Plurality Leader</span>
                  <h2 className="winner-party-name">
                    {winner.partyName} ({winner.partyAbbreviation})
                  </h2>
                  <span style={{ fontSize: '0.85rem', color: '#047857' }}>
                    Secured highest total calculated votes ({Number(winner?.totalVotes || 0).toLocaleString()}) across {lga?.name} polling units.
                  </span>
                </div>
              </div>
              <div>
                <div className="winner-stat-num">{winner?.percentage || 0}%</div>
                <div style={{ fontSize: '0.8rem', color: '#065f46', textAlign: 'right', fontWeight: 600 }}>
                  LGA Vote Share
                </div>
              </div>
            </div>
          )}

          {/* Aggregated Results Table */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <Vote size={20} color="var(--primary)" />
                <h3 className="card-title">Aggregated Party Standings — {lga?.name}</h3>
              </div>
              <span className="badge badge-success">
                Calculated Bottom-Up via MySQL SUM()
              </span>
            </div>

            {results.length === 0 ? (
              <EmptyState
                title="No Results Recorded for this LGA"
                description={`None of the polling units in ${lga?.name} have announced result records in announced_pu_results.`}
                action={
                  <Link to="/new-result" className="btn btn-primary btn-sm">
                    <span>Record Results for {lga?.name}</span>
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
                      <th>Political Party Name</th>
                      <th style={{ textAlign: 'right' }}>Calculated Votes</th>
                      <th style={{ width: '40%' }}>Vote Share %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, index) => (
                      <tr key={r.partyAbbreviation} className={index === 0 ? 'winner-row' : ''}>
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
                        <td style={{ fontWeight: 600, color: 'var(--dark-navy)' }}>
                          {r.partyName}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--dark-navy)', fontSize: '1rem' }}>
                          {Number(r.totalVotes || 0).toLocaleString()}
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
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                      <td colSpan="3" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Total Calculated LGA Votes
                      </td>
                      <td style={{ textAlign: 'right', fontSize: '1.2rem', color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
                        {Number(totalVotes || 0).toLocaleString()}
                      </td>
                      <td colSpan="2" style={{ fontSize: '0.85rem', color: 'var(--slate-muted)' }}>
                        100.00% across {results.length} parties
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Bottom-Up Calculation Verification Accordion (Section 14) */}
          <div className="accordion">
            <div 
              className="accordion-header"
              onClick={() => setShowVerification(!showVerification)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ShieldCheck size={20} color="var(--primary)" />
                <div>
                  <span style={{ fontSize: '1rem' }}>Bottom-Up Calculation Audit & Verification Panel</span>
                  <div style={{ fontSize: '0.78rem', color: 'var(--slate-muted)', fontWeight: 400 }}>
                    Click to inspect the exact polling unit contributions forming this LGA total
                  </div>
                </div>
              </div>
              {showVerification ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {showVerification && (
              <div className="accordion-body">
                <div style={{
                  padding: '1rem',
                  background: '#eff6ff',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #bfdbfe',
                  marginBottom: '1.5rem',
                  fontSize: '0.875rem',
                  color: '#1e40af'
                }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
                    Mathematical Proof of Aggregation:
                  </div>
                  <div>
                    Formula: <code>LGA_Total = SUM(party_score) FROM announced_pu_results INNER JOIN polling_unit ON polling_unit.uniqueid = announced_pu_results.polling_unit_uniqueid WHERE polling_unit.lga_id = {lga?.lgaId || lga?.lga_id}</code>
                  </div>
                  <div style={{ marginTop: '0.35rem', color: '#1d4ed8' }}>
                    ✓ <code>announced_lga_results</code> is NOT queried. Results are calculated live from {breakdown.length} contributing polling units.
                  </div>
                </div>

                {breakdown.length === 0 ? (
                  <p style={{ color: 'var(--slate-muted)' }}>No polling units have recorded returns in this LGA yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {breakdown.map((pu) => (
                      <div
                        key={pu.pollingUnitUniqueId}
                        style={{
                          border: '1px solid var(--slate-border)',
                          borderRadius: 'var(--radius-md)',
                          padding: '1rem',
                          background: '#ffffff'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <div>
                            <span style={{ fontWeight: 700, color: 'var(--dark-navy)' }}>
                              {pu.pollingUnitName || 'Polling Unit'}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--slate-muted)', marginLeft: '0.5rem' }}>
                              ({pu.pollingUnitNumber || `ID #${pu.pollingUnitUniqueId}`})
                            </span>
                          </div>
                          <div style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
                            Unit Total: {Number(pu.totalVotes || 0).toLocaleString()} votes
                          </div>
                        </div>

                        {/* Scores row */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {pu.partyScores && pu.partyScores.map(score => (
                            <span
                              key={score.resultId || score.partyAbbreviation}
                              style={{
                                padding: '0.25rem 0.65rem',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.8rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem'
                              }}
                            >
                              <strong>{score.partyAbbreviation}:</strong> {Number(score.partyScore || 0).toLocaleString()}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
