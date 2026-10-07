import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorAlert({ message, onRetry }) {
  return (
    <div style={{
      background: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '1rem',
      color: '#991b1b',
      margin: '1.5rem 0'
    }}>
      <AlertCircle size={24} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.25rem' }}>
          Unable to Load Data
        </h4>
        <p style={{ fontSize: '0.875rem', color: '#b91c1c', marginBottom: onRetry ? '0.75rem' : '0' }}>
          {message || 'An unexpected error occurred while communicating with the election database.'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn btn-secondary btn-sm"
            style={{ borderColor: '#fca5a5', color: '#991b1b' }}
          >
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>
        )}
      </div>
    </div>
  );
}
