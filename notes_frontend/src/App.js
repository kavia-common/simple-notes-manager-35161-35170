import React, { useEffect, useState } from 'react';
import './App.css';
import { NotesProvider, useNotesStore } from './store/useNotesStore';
import { applyTheme, getSystemPreferredTheme, THEMES } from './utils/theme';
import TopNav from './components/Layout/TopNav';
import Sidebar from './components/Layout/Sidebar';

// PUBLIC_INTERFACE
function App() {
  /** Root application; wraps content in NotesProvider and prepares layout slots. */
  const [theme, setTheme] = useState(getSystemPreferredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((t) => (t === THEMES.light ? THEMES.dark : THEMES.light));
  };

  return (
    <NotesProvider>
      <div className="App">
        <TopNav
          theme={theme}
          onToggleTheme={toggleTheme}
          onNewNote={() => {
            // leverage store inside a bridge component
            // We render a helper to access actions
          }}
        />
        <StoreActionBridge onNewNote />
        <div className="layout">
          <Sidebar />
          <main className="content">
            <MainView />
          </main>
        </div>
      </div>
    </NotesProvider>
  );
}

/**
 * Helper component to bridge actions to TopNav without prop-drilling actions.
 * It listens to a prop flag and exposes a global-safe callback for TopNav's New Note.
 */
function StoreActionBridge({ onNewNote }) {
  const { actions } = useNotesStore();

  // Expose a handler on window for TopNav to call safely
  useEffect(() => {
    window.__notesCreateNew = () => actions.createNote({ title: 'New note', content: '' });
    return () => {
      delete window.__notesCreateNew;
    };
  }, [actions]);

  return null;
}

function MainView() {
  const {
    state: { notes, query, sort, filter, selectedId },
    actions,
  } = useNotesStore();

  const filtered = notes
    .filter((n) => {
      if (filter.showArchived && !n.archived) return false;
      if (filter.showPinnedOnly && !n.pinned) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        (n.title || '').toLowerCase().includes(q) ||
        (n.content || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const { by, order } = sort;
      const vA = a[by] ?? '';
      const vB = b[by] ?? '';
      let cmp = 0;
      if (typeof vA === 'string' && typeof vB === 'string') {
        cmp = vA.localeCompare(vB);
      } else {
        cmp = vA === vB ? 0 : vA > vB ? 1 : -1;
      }
      return order === 'asc' ? cmp : -cmp;
    });

  return (
    <div className="content-inner">
      <div className="toolbar">
        <div className="toolbar-left">
          <span className="title">Notes</span>
          <span className="muted">({filtered.length})</span>
        </div>
        <div className="toolbar-right">
          <button
            className="btn ghost"
            onClick={() => {
              const data = JSON.stringify(filtered, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'notes-export.json';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export
          </button>
          <label className="btn ghost">
            Import
            <input
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const text = await file.text();
                try {
                  const json = JSON.parse(text);
                  if (Array.isArray(json)) {
                    actions.importNotes(json);
                  } else if (Array.isArray(json?.notes)) {
                    actions.importNotes(json.notes);
                  } else {
                    // ignore
                  }
                } catch {
                  // ignore
                } finally {
                  e.target.value = '';
                }
              }}
            />
          </label>
        </div>
      </div>

      <div className="note-list">
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-illustration">🌊</div>
            <div className="empty-title">No notes yet</div>
            <div className="empty-subtitle">Create your first note to get started.</div>
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              className={`note-card ${selectedId === n.id ? 'active' : ''}`}
              onClick={() => actions.selectNote(n.id)}
            >
              <div className="note-card-header">
                <div className="note-card-title">{n.title || 'Untitled'}</div>
                <div className="note-card-actions">
                  <button
                    className="icon-btn"
                    title={n.pinned ? 'Unpin' : 'Pin'}
                    onClick={(e) => {
                      e.stopPropagation();
                      actions.togglePin(n.id);
                    }}
                  >
                    {n.pinned ? '📌' : '📍'}
                  </button>
                  <button
                    className="icon-btn"
                    title={n.archived ? 'Unarchive' : 'Archive'}
                    onClick={(e) => {
                      e.stopPropagation();
                      actions.toggleArchive(n.id);
                    }}
                  >
                    {n.archived ? '🗂️' : '📦'}
                  </button>
                  <button
                    className="icon-btn danger"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      actions.deleteNote(n.id);
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="note-card-content">
                {n.content ? n.content.slice(0, 140) : 'No content yet.'}
              </div>
              <div className="note-card-meta">
                <span>{new Date(n.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
