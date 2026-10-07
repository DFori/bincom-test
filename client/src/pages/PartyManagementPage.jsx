import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/apiClient';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  Check, 
  ShieldAlert,
  Search,
  CheckCircle2
} from 'lucide-react';

export default function PartyManagementPage() {
  const { addToast } = useToast();

  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPartyId, setNewPartyId] = useState('');
  const [newPartyName, setNewPartyName] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingParty, setEditingParty] = useState(null);
  const [editPartyId, setEditPartyId] = useState('');
  const [editPartyName, setEditPartyName] = useState('');
  const [updating, setUpdating] = useState(false);

  // Delete Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingParty, setDeletingParty] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Parties
  const loadParties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getParties();
      setParties(data);
    } catch (err) {
      setError(err.message || 'Failed to load political parties');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadParties();
  }, [loadParties]);

  // Handle Create Party
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newPartyId.trim() || !newPartyName.trim()) {
      addToast('Please provide both party abbreviation and full name.', 'error');
      return;
    }

    try {
      setCreating(true);
      await apiClient.createParty({
        partyid: newPartyId.trim(),
        partyname: newPartyName.trim()
      });

      addToast(`Party '${newPartyId.toUpperCase()}' registered successfully!`, 'success');
      setIsCreateOpen(false);
      setNewPartyId('');
      setNewPartyName('');
      loadParties();
    } catch (err) {
      addToast(err.message || 'Failed to create party', 'error');
    } finally {
      setCreating(false);
    }
  };

  // Handle Edit Party
  const openEditModal = (party) => {
    setEditingParty(party);
    setEditPartyId(party.partyId);
    setEditPartyName(party.partyName);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editPartyName.trim()) {
      addToast('Party name cannot be empty.', 'error');
      return;
    }

    try {
      setUpdating(true);
      await apiClient.updateParty(editingParty.id, {
        partyid: editPartyId.trim(),
        partyname: editPartyName.trim()
      });

      addToast(`Party updated successfully!`, 'success');
      setIsEditOpen(false);
      loadParties();
    } catch (err) {
      addToast(err.message || 'Failed to update party', 'error');
    } finally {
      setUpdating(false);
    }
  };

  // Handle Delete Party
  const openDeleteModal = (party) => {
    setDeletingParty(party);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingParty) return;

    try {
      setDeleting(true);
      await apiClient.deleteParty(deletingParty.id);
      addToast(`Party '${deletingParty.partyId}' deleted successfully.`, 'success');
      setIsDeleteOpen(false);
      loadParties();
    } catch (err) {
      addToast(err.message || 'Failed to delete party', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filteredParties = parties.filter(p => 
    p.partyId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.partyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-primary">Party Management</span>
            <span className="badge badge-slate">New Polling System</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--dark-navy)' }}>
            Accredited Political Parties
          </h1>
          <p style={{ color: 'var(--slate-muted)', fontSize: '0.95rem' }}>
            Manage registered political parties in the database with strict election result reference protection.
          </p>
        </div>

        <button 
          onClick={() => setIsCreateOpen(true)}
          className="btn btn-primary"
        >
          <Plus size={18} />
          <span>Register New Party</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div className="filter-bar" style={{ margin: 0 }}>
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              className="form-control"
              placeholder="Search by party abbreviation or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="badge badge-slate" style={{ padding: '0.65rem 1rem' }}>
            Total: {parties.length} Parties
          </span>
        </div>
      </div>

      {/* Error state */}
      {error && <ErrorAlert message={error} onRetry={loadParties} />}

      {/* Main Party Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <LoadingSpinner message="Loading registered political parties..." />
        ) : (
          <div className="table-responsive" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>ID</th>
                  <th style={{ width: '160px' }}>Party Abbreviation</th>
                  <th>Party Full Name</th>
                  <th style={{ textAlign: 'center' }}>Historical Results Attached</th>
                  <th style={{ textAlign: 'center' }}>Integrity Status</th>
                  <th style={{ textAlign: 'center', width: '160px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredParties.map((party) => (
                  <tr key={party.id}>
                    <td>
                      <span style={{ color: 'var(--slate-muted)', fontWeight: 600 }}>
                        #{party.id}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-primary" style={{ fontSize: '0.9rem', fontWeight: 800 }}>
                        {party.partyId}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--dark-navy)' }}>
                        {party.partyName}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {party.resultCount > 0 ? (
                        <span className="badge badge-warning">
                          {party.resultCount} PU Result Records
                        </span>
                      ) : (
                        <span className="badge badge-slate">
                          0 Results Attached
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {party.resultCount > 0 ? (
                        <span className="badge badge-success" title="Protected from deletion to preserve election data integrity">
                          <CheckCircle2 size={12} /> Protected Reference
                        </span>
                      ) : (
                        <span className="badge badge-slate">
                          Safe to Delete
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => openEditModal(party)}
                          className="btn btn-secondary btn-sm"
                          title="Edit party information"
                        >
                          <Edit2 size={14} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => openDeleteModal(party)}
                          className="btn btn-danger btn-sm"
                          title={party.resultCount > 0 ? "Protected party: referenced by existing results" : "Delete party"}
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register New Party Modal */}
      <Modal
        isOpen={isCreateOpen}
        title="Register New Political Party"
        onClose={() => setIsCreateOpen(false)}
        footer={
          <>
            <button 
              type="button" 
              onClick={() => setIsCreateOpen(false)} 
              className="btn btn-secondary"
              disabled={creating}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              form="create-party-form" 
              className="btn btn-primary"
              disabled={creating}
            >
              {creating ? 'Registering...' : 'Save Party'}
            </button>
          </>
        }
      >
        <form id="create-party-form" onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label className="form-label">Party Abbreviation / Code *</label>
            <input
              type="text"
              className="form-input-text"
              placeholder="e.g. LP, NNPP, APGA"
              value={newPartyId}
              onChange={(e) => setNewPartyId(e.target.value.toUpperCase())}
              maxLength={11}
              required
            />
            <div className="form-helper">
              Unique short identifier used on ballot papers and result sheets.
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Party Full Name *</label>
            <input
              type="text"
              className="form-input-text"
              placeholder="e.g. Labour Party"
              value={newPartyName}
              onChange={(e) => setNewPartyName(e.target.value)}
              maxLength={50}
              required
            />
            <div className="form-helper">
              Official registered party title.
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Party Modal */}
      <Modal
        isOpen={isEditOpen}
        title={`Edit Party: ${editingParty?.partyId}`}
        onClose={() => setIsEditOpen(false)}
        footer={
          <>
            <button 
              type="button" 
              onClick={() => setIsEditOpen(false)} 
              className="btn btn-secondary"
              disabled={updating}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              form="edit-party-form" 
              className="btn btn-primary"
              disabled={updating}
            >
              {updating ? 'Updating...' : 'Save Changes'}
            </button>
          </>
        }
      >
        <form id="edit-party-form" onSubmit={handleEditSubmit}>
          <div className="form-group">
            <label className="form-label">Party Abbreviation / Code *</label>
            <input
              type="text"
              className="form-input-text"
              value={editPartyId}
              onChange={(e) => setEditPartyId(e.target.value.toUpperCase())}
              maxLength={11}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Party Full Name *</label>
            <input
              type="text"
              className="form-input-text"
              value={editPartyName}
              onChange={(e) => setEditPartyName(e.target.value)}
              maxLength={50}
              required
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        title="Confirm Party Deletion"
        onClose={() => setIsDeleteOpen(false)}
        footer={
          <>
            <button 
              type="button" 
              onClick={() => setIsDeleteOpen(false)} 
              className="btn btn-secondary"
              disabled={deleting}
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleDeleteConfirm} 
              className="btn btn-danger"
              disabled={deleting || (deletingParty && deletingParty.resultCount > 0)}
            >
              {deleting ? 'Deleting...' : 'Delete Party'}
            </button>
          </>
        }
      >
        <div>
          {deletingParty?.resultCount > 0 ? (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              color: '#991b1b',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                <ShieldAlert size={20} color="#ef4444" />
                <span>Deletion Blocked: Election Integrity Safeguard</span>
              </div>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                Party <strong>{deletingParty?.partyId}</strong> ({deletingParty?.partyName}) is referenced by <strong>{deletingParty?.resultCount}</strong> recorded polling unit election result(s). 
                Deleting this party would corrupt historical tally records.
              </p>
            </div>
          ) : (
            <div style={{ color: 'var(--dark-navy)', fontSize: '0.95rem', lineHeight: 1.5 }}>
              <p>Are you sure you want to delete <strong>{deletingParty?.partyId}</strong> ({deletingParty?.partyName})?</p>
              <p style={{ color: 'var(--slate-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                This party has 0 attached result records and can be safely removed.
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
