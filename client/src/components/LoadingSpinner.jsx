import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading election data...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3.5rem 1rem',
      gap: '0.75rem',
      color: '#64748b'
    }}>
      <Loader2 size={32} className="spin" color="#4f46e5" style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: '0.925rem', fontWeight: 500 }}>{message}</span>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
