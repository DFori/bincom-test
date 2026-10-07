import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'No records found', description = 'Try adjusting your search filters or selecting a different LGA.', action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Inbox size={32} />
      </div>
      <h4 className="empty-state-title">{title}</h4>
      <p className="empty-state-desc">{description}</p>
      {action}
    </div>
  );
}
