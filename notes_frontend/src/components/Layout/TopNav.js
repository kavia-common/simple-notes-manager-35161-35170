import React from 'react';
import { useNotesStore } from '../../store/useNotesStore';

/**
 * Top navigation bar with brand, search, new note button, and theme toggle.
 * Ocean Professional styling uses subtle gradients and rounded corners.
 */
// PUBLIC_INTERFACE
export default function TopNav({ theme, onToggleTheme, onNewNote }) {
  /** TopNav: renders brand, search input, "New Note" button, and theme toggle. */
  const {
    state: { query },
    actions,
  } = useNotesStore();

  return (
    <header className="topbar" role="banner">
      <div className="brand" aria-label="Application brand">
        <span className="brand-mark" aria-hidden="true">🗒️</span>
        <span className="brand-name">Simple Notes</span>
      </div>

      <div className="topbar-center" role="search">
        <input
          className="input topbar-search"
          type="search"
          placeholder="Search notes..."
          aria-label="Search notes"
          value={query}
          onChange={(e) => actions.setQuery(e.target.value)}
        />
      </div>

      <div className="topbar-actions">
        <button
          className="btn primary"
          onClick={() => {
            if (typeof onNewNote === 'function') {
              onNewNote();
            } else if (typeof window !== 'undefined' && typeof window.__notesCreateNew === 'function') {
              window.__notesCreateNew();
            }
          }}
          aria-label="Create a new note"
        >
          + New Note
        </button>
        <button
          className="btn ghost"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>
    </header>
  );
}
