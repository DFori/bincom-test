import React from 'react';

export default function StatCard({ label, value, hint, icon, colorClass = 'icon-indigo' }) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        <div className={`stat-icon-wrapper ${colorClass}`}>
          {icon}
        </div>
      </div>
      <div className="stat-value">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}
