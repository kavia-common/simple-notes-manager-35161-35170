import React, { useState } from 'react';
import { useNotesStore } from '../../store/useNotesStore';

/**
 * Sidebar for filters and quick stats with Ocean Professional styling.
 * Includes responsive collapsible behavior for small screens.
 */
// PUBLIC_INTERFACE
export default function Sidebar() {
  /** Sidebar: filter chips for All/Pinned/Archived with counts and settings. */
  const {
    state: { notes, filter, sort },
    actions,
  } = useNotesStore();

  const counts = {
    all: notes.length,
    pinned: notes.filter((n) => n.pinned && !n.archived).length,
    archived: notes.filter((n) => n.archived).length,
  };

  const [open, setOpen] = useState(false);

  const currentFilter =
    filter.showPinnedOnly ? 'pinned' : filter.showArchived ? 'archived' : 'all';

  function setFilterFromKey(key) {
    actions.setFilter({
      showPinnedOnly: key === 'pinned',
      showArchived: key === 'archived',
    });
    // On small screens, auto close after choosing
    setOpen(false);
  }

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Sidebar">
      <div className="sidebar-mobile-toggle">
        <button
          className="btn ghost w-full"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="sidebar-sections"
        >
          {open ? 'Hide Filters ▲' : 'Show Filters ▼'}
        </button>
      </div>

      <div id="sidebar-sections" className="sidebar-inner">
        <h3 className="sidebar-title">Library</h3>

        <div className="sidebar-section">
          <div className="stat">
            <span className="stat-label">Notes</span>
            <span className="stat-value">{counts.all}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Pinned</span>
            <span className="stat-value">{counts.pinned}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Archived</span>
            <span className="stat-value">{counts.archived}</span>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="filter-chips" role="tablist" aria-label="Note filters">
            <button
              role="tab"
              aria-selected={currentFilter === 'all'}
              className={`chip ${currentFilter === 'all' ? 'active' : ''}`}
              onClick={() => setFilterFromKey('all')}
            >
              All ({counts.all})
            </button>
            <button
              role="tab"
              aria-selected={currentFilter === 'pinned'}
              className={`chip ${currentFilter === 'pinned' ? 'active' : ''}`}
              onClick={() => setFilterFromKey('pinned')}
            >
              Pinned ({counts.pinned})
            </button>
            <button
              role="tab"
              aria-selected={currentFilter === 'archived'}
              className={`chip ${currentFilter === 'archived' ? 'active' : ''}`}
              onClick={() => setFilterFromKey('archived')}
            >
              Archived ({counts.archived})
            </button>
          </div>
        </div>

        <div className="sidebar-section">
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
      </div>
    </aside>
  );
}
