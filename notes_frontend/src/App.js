import React, { useEffect, useState } from 'react';
import './App.css';
import { NotesProvider, useNotesStore } from './store/useNotesStore';
import { applyTheme, getSystemPreferredTheme, THEMES } from './utils/theme';

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
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark">🗒️</span>
            <span className="brand-name">Simple Notes</span>
          </div>
          <div className="topbar-actions">
            <button
              className="btn ghost"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>
        </header>

        <div className="layout">
          <aside className="sidebar">
            {/* Placeholder: Sidebar filters/actions will be added next step */}
            <SidebarPreview />
          </aside>
          <main className="content">
            {/* Placeholder: Toolbar, search bar, and notes list/editor will be added next step */}
            <MainPreview />
          </main>
        </div>
      </div>
    </NotesProvider>
  );
}

function SidebarPreview() {
  const {
    state: { query, filter, sort, notes },
    actions,
  } = useNotesStore();

  return (
    <div className="sidebar-inner">
      <h3 className="sidebar-title">Library</h3>
      <div className="sidebar-section">
        <div className="stat">
          <span className="stat-label">Notes</span>
          <span className="stat-value">{notes.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Pinned</span>
          <span className="stat-value">{notes.filter((n) => n.pinned && !n.archived).length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Archived</span>
          <span className="stat-value">{notes.filter((n) => n.archived).length}</span>
        </div>
      </div>

      <div className="sidebar-section">
        <label className="field">
          <span className="field-label">Search</span>
          <input
            className="input"
            placeholder="Search notes..."
            value={query}
            onChange={(e) => actions.setQuery(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field-label">Show</span>
          <select
            className="input"
            value={`${filter.showPinnedOnly ? 'pinned' : filter.showArchived ? 'archived' : 'all'}`}
            onChange={(e) => {
              const v = e.target.value;
              actions.setFilter({
                showPinnedOnly: v === 'pinned',
                showArchived: v === 'archived',
              });
            }}
          >
            <option value="all">All</option>
            <option value="pinned">Pinned</option>
            <option value="archived">Archived</option>
          </select>
        </label>

        <label className="field">
          <span className="field-label">Sort by</span>
          <select
            className="input"
            value={`${sort.by}:${sort.order}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split(':');
              actions.setSort({ by, order });
            }}
          >
            <option value="updatedAt:desc">Updated (newest)</option>
            <option value="updatedAt:asc">Updated (oldest)</option>
            <option value="createdAt:desc">Created (newest)</option>
            <option value="createdAt:asc">Created (oldest)</option>
            <option value="title:asc">Title (A→Z)</option>
            <option value="title:desc">Title (Z→A)</option>
          </select>
        </label>
      </div>

      <div className="sidebar-section">
        <button
          className="btn primary w-full"
          onClick={() => actions.createNote({ title: 'New note', content: '' })}
        >
          + New Note
        </button>
      </div>
    </div>
  );
}

function MainPreview() {
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
              // simple export preview
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
