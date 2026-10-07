import React from 'react';
import { Shield, Database } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Shield size={18} color="#4f46e5" />
          <span className="footer-credits">
            <strong>Delta State Election Results Aggregation System</strong> — 2011 Historical Archive
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8' }}>
            <Database size={15} />
            Schema: bincomphptest (Delta state_id = 25)
          </span>
          <span style={{ color: '#64748b' }}>•</span>
          <span style={{ color: '#10b981', fontWeight: 600 }}>Pure Bottom-Up Aggregation</span>
        </div>
      </div>
    </footer>
  );
}
