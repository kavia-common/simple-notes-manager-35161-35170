import React, { useEffect, useState } from 'react';
import './App.css';
import { NotesProvider, useNotesStore } from './store/useNotesStore';
import { applyTheme, getSystemPreferredTheme, THEMES } from './utils/theme';
import TopNav from './components/Layout/TopNav';
import Sidebar from './components/Layout/Sidebar';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import EmptyState from './components/EmptyState';

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
            // optional direct handler; fallback bridge is also provided
          }}
        />
        <StoreActionBridge />
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
 * It exposes a global-safe callback for TopNav's New Note.
 */
function StoreActionBridge() {
  const { actions } = useNotesStore();

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
      // If 'showArchived' is enabled, only show archived notes
      if (filter.showArchived) return n.archived;
      // If 'showPinnedOnly' is enabled, only show pinned and not archived
      if (filter.showPinnedOnly) return n.pinned && !n.archived;
      // Otherwise show active notes (not archived)
      if (n.archived) return false;

      // Apply search query
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

  const selected = filtered.find((n) => n.id === selectedId) || null;

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
                  }
                } catch {
                  // ignore invalid files
                } finally {
                  e.target.value = '';
                }
              }}
            />
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="🌊"
          title="No notes yet"
          subtitle="Create your first note to get started."
        />
      ) : (
        <>
          <NoteList notes={filtered} />
          <div style={{ marginTop: 16 }} />
          <NoteEditor key={selected ? selected.id : 'no-selection'} />
        </>
      )}
    </div>
  );
}

export default App;
