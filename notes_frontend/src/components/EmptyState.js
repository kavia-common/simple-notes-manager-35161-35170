import React from 'react';

/**
 * EmptyState is a simple reusable component for displaying empty UI.
 */
// PUBLIC_INTERFACE
export default function EmptyState({ icon = '🌊', title = 'Nothing here', subtitle = 'Try creating something new.' }) {
  /** Generic empty state block with icon, title, and subtitle. */
  return (
    <div className="empty">
      <div className="empty-illustration" aria-hidden="true">{icon}</div>
      <div className="empty-title">{title}</div>
      <div className="empty-subtitle">{subtitle}</div>
    </div>
  );
}
