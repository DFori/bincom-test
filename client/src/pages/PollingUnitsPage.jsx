import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import { 
  Building2, 
  Search, 
  Filter, 
  ArrowRight, 
  CheckCircle, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight,
  PlusCircle
} from 'lucide-react';

export default function PollingUnitsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [pollingUnits, setPollingUnits] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedLga, setSelectedLga] = useState(searchParams.get('lgaId') || '');
  const [hasResultsOnly, setHasResultsOnly] = useState(searchParams.get('hasResults') === 'true');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch Delta LGAs for dropdown
  useEffect(() => {
    async function loadLgas() {
      try {
        const lgaList = await apiClient.getDeltaLgas();
        setLgas(lgaList);
      } catch (err) {
        console.error('Failed to load LGAs:', err);
      }
    }
    loadLgas();
  }, []);

  // Fetch Polling Units
  const fetchPollingUnits = useCallback(async (pageToLoad = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.getPollingUnits({
        page: pageToLoad,
        limit: 20,
        search: search.trim(),
        lgaId: selectedLga || undefined,
        hasResultsOnly: hasResultsOnly
      });

      setPollingUnits(res.data);
      setPagination({
        page: res.page,
        limit: res.limit,
        total: res.total,
        totalPages: res.totalPages
      });
    } catch (err) {
      setError(err.message || 'Failed to retrieve polling units');
    } finally {
      setLoading(false);
    }
  }, [search, selectedLga, hasResultsOnly]);

  useEffect(() => {
    fetchPollingUnits(1);
  }, [fetchPollingUnits]);

  // Handle Search Submission / Reset
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (selectedLga) params.set('lgaId', selectedLga);
    if (hasResultsOnly) params.set('hasResults', 'true');
    setSearchParams(params);
    fetchPollingUnits(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedLga('');
    setHasResultsOnly(false);
    setSearchParams({});
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
            Delta State Polling Units
          </h1>
          <p style={{ color: 'var(--slate-muted)', fontSize: '0.95rem' }}>
            Browse and inspect election returns for all registered polling units across Delta State.
          </p>
        </div>
        <Link to="/new-result" className="btn btn-primary">
          <PlusCircle size={17} />
          <span>Record Polling Unit Result</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <form onSubmit={handleSearchSubmit} className="filter-bar" style={{ margin: 0 }}>
          {/* Text Search */}
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              className="form-control"
              placeholder="Search by polling unit name, code, ward, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* LGA Select Filter */}
          <select
            className="select-control"
            value={selectedLga}
            onChange={(e) => {
              setSelectedLga(e.target.value);
            }}
          >
            <option value="">All Delta LGAs</option>
            {lgas.map(lga => (
              <option key={lga.lgaId} value={lga.lgaId}>
                {lga.name}
              </option>
            ))}
          </select>

          {/* Has Results Checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-dark)' }}>
            <input
              type="checkbox"
              checked={hasResultsOnly}
              onChange={(e) => setHasResultsOnly(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <span>Only with Results</span>
          </label>

          {/* Actions */}
          <button type="submit" className="btn btn-primary btn-sm">
            <Filter size={15} />
            <span>Apply</span>
          </button>

          {(search || selectedLga || hasResultsOnly) && (
            <button type="button" onClick={handleResetFilters} className="btn btn-secondary btn-sm">
              <span>Reset</span>
            </button>
          )}
        </form>
      </div>

      {/* Error Message */}
      {error && <ErrorAlert message={error} onRetry={() => fetchPollingUnits(pagination.page)} />}

      {/* Main Table Content */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <LoadingSpinner message="Searching polling units..." />
        ) : pollingUnits.length === 0 ? (
          <EmptyState
            title="No Polling Units Found"
            description="No polling units match your active filter criteria. Try clearing or broadening your search."
            action={
              (search || selectedLga || hasResultsOnly) && (
                <button onClick={handleResetFilters} className="btn btn-secondary btn-sm">
                  <span>Clear All Filters</span>
                </button>
              )
            }
          />
        ) : (
          <>
            <div className="table-responsive" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '90px' }}>ID / Code</th>
                    <th>Polling Unit Name</th>
                    <th>Local Government (LGA)</th>
                    <th>Ward</th>
                    <th>Result Status</th>
                    <th style={{ textAlign: 'right' }}>Total Votes</th>
                    <th style={{ textAlign: 'center', width: '130px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pollingUnits.map((pu) => (
                    <tr key={pu.uniqueId}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: '#4338ca' }}>
                          {pu.pollingUnitNumber !== 'N/A' && pu.pollingUnitNumber ? pu.pollingUnitNumber : `#${pu.uniqueId}`}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--dark-navy)' }}>
                          {pu.pollingUnitName}
                        </div>
                        {pu.description && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--slate-muted)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {pu.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--slate-dark)' }}>
                          {pu.lgaName}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--slate-muted)', fontSize: '0.875rem' }}>
                          {pu.wardName}
                        </span>
                      </td>
                      <td>
                        {pu.hasResults ? (
                          <span className="badge badge-success">
                            <CheckCircle size={12} /> {pu.resultsCount} Parties Recorded
                          </span>
                        ) : (
                          <span className="badge badge-slate">
                            <HelpCircle size={12} /> No Results Yet
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                        {pu.totalVotes > 0 ? pu.totalVotes.toLocaleString() : '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Link
                          to={`/polling-units/${pu.uniqueId}`}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.35rem 0.75rem', width: '100%' }}
                        >
                          <span>Results</span>
                          <ArrowRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--slate-border)',
              background: '#f8fafc'
            }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--slate-muted)' }}>
                Showing <strong>{((pagination.page - 1) * pagination.limit) + 1}</strong> to <strong>{Math.min(pagination.total, pagination.page * pagination.limit)}</strong> of <strong>{pagination.total.toLocaleString()}</strong> polling units
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={() => fetchPollingUnits(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="btn btn-secondary btn-sm"
                >
                  <ChevronLeft size={16} />
                  <span>Prev</span>
                </button>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, padding: '0 0.5rem' }}>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchPollingUnits(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="btn btn-secondary btn-sm"
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
