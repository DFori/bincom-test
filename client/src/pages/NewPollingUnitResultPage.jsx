import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { useToast } from '../components/Toast';
import { 
  Building2, 
  MapPin, 
  Vote, 
  PlusCircle, 
  ArrowLeft, 
  Save, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function NewPollingUnitResultPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [lgas, setLgas] = useState([]);
  const [parties, setParties] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form Fields
  const [selectedLgaId, setSelectedLgaId] = useState('');
  const [puName, setPuName] = useState('');
  const [puNumber, setPuNumber] = useState('');
  const [puDescription, setPuDescription] = useState('');
  const [officerName, setOfficerName] = useState('Presiding Officer');
  const [partyScores, setPartyScores] = useState({});

  useEffect(() => {
    async function loadData() {
      try {
        setLoadingInitial(true);
        const [lgaList, partyList] = await Promise.all([
          apiClient.getDeltaLgas(),
          apiClient.getParties()
        ]);
        setLgas(lgaList);
        setParties(partyList);

        if (lgaList.length > 0) {
          setSelectedLgaId(String(lgaList[0].lgaId));
        }

        // Initialize score map for parties
        const initialScores = {};
        partyList.forEach(p => {
          initialScores[p.partyId] = 0;
        });
        setPartyScores(initialScores);
      } catch (err) {
        setError(err.message || 'Failed to initialize form data');
      } finally {
        setLoadingInitial(false);
      }
    }
    loadData();
  }, []);

  const handleScoreChange = (partyId, value) => {
    const num = Math.max(0, parseInt(value, 10) || 0);
    setPartyScores(prev => ({
      ...prev,
      [partyId]: num
    }));
  };

  const totalCalculatedVotes = Object.values(partyScores).reduce((acc, curr) => acc + (Number(curr) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!puName.trim()) {
      addToast('Please provide a polling unit name.', 'error');
      return;
    }

    if (!selectedLgaId) {
      addToast('Please select a Delta State LGA.', 'error');
      return;
    }

    const formattedResults = Object.entries(partyScores).map(([partyAbbr, score]) => ({
      partyAbbreviation: partyAbbr,
      partyScore: Number(score)
    }));

    try {
      setSubmitting(true);
      const res = await apiClient.createPollingUnitResults({
        pollingUnitName: puName.trim(),
        pollingUnitNumber: puNumber.trim() || `DT${selectedLgaId}01${Date.now().toString().slice(-4)}`,
        pollingUnitDescription: puDescription.trim(),
        lgaId: parseInt(selectedLgaId, 10),
        wardId: 1,
        enteredByUser: officerName.trim(),
        results: formattedResults
      });

      addToast('Polling Unit and Election Results successfully recorded!', 'success');
      // Navigate to the newly created polling unit's detail page
      navigate(`/polling-units/${res.uniqueId}`);
    } catch (err) {
      addToast(err.message || 'Failed to record polling unit results', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return <LoadingSpinner message="Loading LGA and party registries..." />;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <Link to="/polling-units" className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}>
          <ArrowLeft size={16} />
          <span>Back to Polling Units</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <span className="badge badge-primary">New Polling System</span>
          <span className="badge badge-success">Direct Database Entry</span>
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
          Record New Polling Unit Result
        </h1>
        <p style={{ color: 'var(--slate-muted)', fontSize: '0.95rem' }}>
          Enter announced party vote counts for a polling unit. Results will automatically update LGA aggregates.
        </p>
      </div>

      {error && <ErrorAlert message={error} />}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
          {/* Unit Metadata Card */}
          <div className="card" style={{ height: 'fit-content' }}>
            <div className="card-header">
              <div className="card-title-group">
                <Building2 size={20} color="var(--primary)" />
                <h3 className="card-title">1. Station Details</h3>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Delta State Local Government (LGA) *</label>
              <select
                className="select-control"
                value={selectedLgaId}
                onChange={(e) => setSelectedLgaId(e.target.value)}
                style={{ width: '100%' }}
                required
              >
                {lgas.map(lga => (
                  <option key={lga.lgaId} value={lga.lgaId}>
                    {lga.name} (LGA #{lga.lgaId})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Polling Unit Name *</label>
              <input
                type="text"
                className="form-input-text"
                placeholder="e.g. Asaba Civic Centre Unit 2"
                value={puName}
                onChange={(e) => setPuName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Polling Unit Code / Number</label>
              <input
                type="text"
                className="form-input-text"
                placeholder="e.g. DT1501008 (Leave blank for auto-generate)"
                value={puNumber}
                onChange={(e) => setPuNumber(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Presiding Officer Name</label>
              <input
                type="text"
                className="form-input-text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Description / Location Landmark</label>
              <textarea
                className="form-input-text"
                rows={3}
                placeholder="e.g. Primary School Hall near Main Post Office"
                value={puDescription}
                onChange={(e) => setPuDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Party Scores Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <Vote size={20} color="var(--primary)" />
                <h3 className="card-title">2. Announced Party Scores</h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Total Ballots
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--primary)' }}>
                  {totalCalculatedVotes.toLocaleString()}
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--slate-muted)', marginBottom: '1rem' }}>
              Input the certified vote counts declared for each accredited party at this station.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {parties.map(party => (
                <div
                  key={party.partyId}
                  style={{
                    padding: '0.85rem',
                    border: '1px solid var(--slate-border)',
                    borderRadius: 'var(--radius-md)',
                    background: '#ffffff'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span className="badge badge-primary" style={{ fontWeight: 800 }}>
                      {party.partyId}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--slate-muted)' }}>
                      {party.partyName}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    className="form-input-text"
                    style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-heading)', textAlign: 'right' }}
                    value={partyScores[party.partyId] || 0}
                    onChange={(e) => handleScoreChange(party.partyId, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Action Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '1rem',
          padding: '1.5rem',
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--slate-border)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <Link to="/polling-units" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            <Save size={18} />
            <span>{submitting ? 'Recording Results...' : 'Submit & Publish Unit Results'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
