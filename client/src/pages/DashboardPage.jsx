import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { 
  Building2, 
  MapPin, 
  Users, 
  Vote, 
  Trophy, 
  ArrowRight, 
  CheckCircle2, 
  PlusCircle, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading Delta State election dashboard..." />;
  }

  if (error) {
    return <ErrorAlert message={error} onRetry={fetchStats} />;
  }

  const { overview, leaderboard, lgasSummary } = stats || {};
  const leadingParty = leaderboard && leaderboard.length > 0 ? leaderboard[0] : null;

  return (
    <div>
      {/* Hero Banner */}
      <div className="hero-card">
        <div className="hero-tag">
          <ShieldCheck size={14} />
          <span>Delta State 2011 Election Archives</span>
        </div>
        <h1 className="hero-title">
          Delta State Election Results Aggregation Portal
        </h1>
        <p className="hero-description">
          Explore individual polling unit scorecards, dynamically calculate bottom-up Local Government Area aggregates, and manage accredited political parties with strict data integrity.
        </p>
        <div className="hero-actions">
          <Link to="/lga-results" className="btn btn-primary btn-lg">
            <Vote size={18} />
            <span>Calculate LGA Results</span>
          </Link>
          <Link to="/polling-units" className="btn btn-outline btn-lg">
            <Building2 size={18} />
            <span>Explore Polling Units</span>
          </Link>
          <Link to="/new-result" className="btn btn-outline btn-lg">
            <PlusCircle size={18} />
            <span>Record New Result</span>
          </Link>
        </div>
      </div>

      {/* Overview Stat Grid */}
      <div className="stat-grid">
        <StatCard 
          label="Delta State LGAs"
          value={overview?.totalLgas || 25}
          hint="Delta State (state_id = 25)"
          icon={<MapPin size={22} />}
          colorClass="icon-blue"
        />
        <StatCard 
          label="Polling Units"
          value={overview?.totalPollingUnits || 0}
          hint="Registered Polling Stations"
          icon={<Building2 size={22} />}
          colorClass="icon-indigo"
        />
        <StatCard 
          label="Registered Parties"
          value={overview?.totalParties || 0}
          hint="Accredited Political Parties"
          icon={<Users size={22} />}
          colorClass="icon-emerald"
        />
        <StatCard 
          label="Total Ballots Cast"
          value={overview?.totalVotes || 0}
          hint="From Polling Unit Results"
          icon={<Vote size={22} />}
          colorClass="icon-amber"
        />
      </div>

      {/* Winner / Leading Party Spotlight */}
      {leadingParty && (
        <div className="winner-spotlight">
          <div className="winner-spotlight-content">
            <div className="winner-trophy-icon">
              <Vote size={24} />
            </div>
            <div>
              <span className="winner-info-title">Statewide Plurality Leader</span>
              <h2 className="winner-party-name">
                {leadingParty.partyName || leadingParty.partyname} ({leadingParty.partyAbbreviation || leadingParty.party_abbreviation})
              </h2>
              <span style={{ fontSize: '0.825rem', color: '#047857' }}>
                Cumulative leading party across certified polling unit returns
              </span>
            </div>
          </div>
          <div>
            <div className="winner-stat-num">
              {Number(leadingParty.totalVotes ?? leadingParty.total_votes ?? 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#065f46', textAlign: 'right', fontWeight: 600 }}>
              Total Polling Unit Ballots
            </div>
          </div>
        </div>
      )}

      {/* Statewide Party Leaderboard */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h3 className="card-title">Statewide Party Vote Distribution</h3>
          </div>
          <Link to="/parties" className="btn btn-secondary btn-sm">
            <span>Manage Parties</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Rank</th>
                <th>Party Code</th>
                <th>Full Party Name</th>
                <th style={{ textAlign: 'right' }}>Total Votes</th>
                <th style={{ width: '35%' }}>Vote Share</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard && leaderboard.map((item, index) => {
                const totalStatewide = overview?.totalVotes || 1;
                const itemVotes = Number(item.totalVotes ?? item.total_votes ?? 0);
                const pct = totalStatewide > 0 ? ((itemVotes / totalStatewide) * 100).toFixed(2) : 0;
                const partyCode = item.partyAbbreviation || item.party_abbreviation || 'UNKNOWN';
                const partyFullName = item.partyName || item.partyname || partyCode;

                return (
                  <tr key={partyCode} className={index === 0 ? 'winner-row' : ''}>
                    <td>
                      <span className={`rank-badge ${index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : ''}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-primary">{partyCode}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {partyFullName}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                      {itemVotes.toLocaleString()}
                    </td>
                    <td>
                      <div className="vote-bar-container">
                        <div className="progress-track">
                          <div 
                            className={`progress-fill ${index === 0 ? 'winner' : ''}`}
                            style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                          />
                        </div>
                        <span className="vote-pct-text">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delta State LGAs Summary Explorer */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h3 className="card-title">Delta State Local Government Areas</h3>
          </div>
          <span className="badge badge-slate">25 Administrative LGAs</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1rem'
        }}>
          {lgasSummary && lgasSummary.map((lga) => {
            const lgaId = lga.lgaId ?? lga.lga_id;
            const lgaName = lga.lgaName ?? lga.lga_name;
            const pusWithResults = Number(lga.pusWithResults ?? lga.pus_with_results ?? 0);
            const totalVotes = Number(lga.totalVotes ?? lga.total_votes ?? 0);

            return (
              <div 
                key={lgaId}
                style={{
                  border: '1px solid var(--slate-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.15rem',
                  background: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                      LGA #{lgaId}
                    </span>
                    {pusWithResults > 0 ? (
                      <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                        <CheckCircle2 size={11} /> {pusWithResults} PUs Recorded
                      </span>
                    ) : (
                      <span className="badge badge-slate" style={{ fontSize: '0.7rem' }}>
                        Pending PU Results
                      </span>
                    )}
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--dark-navy)' }}>
                    {lgaName}
                  </h4>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.65rem',
                  borderTop: '1px solid #f1f5f9'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Calculated Votes</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--dark-navy)' }}>
                      {totalVotes.toLocaleString()}
                    </div>
                  </div>
                  <Link 
                    to={`/lga-results?lgaId=${lgaId}`}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.35rem 0.65rem' }}
                    title={`View calculated results for ${lgaName}`}
                  >
                    <span>Results</span>
                    <ExternalLink size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
