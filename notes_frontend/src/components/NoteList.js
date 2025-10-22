import React from 'react';
import { useNotesStore } from '../store/useNotesStore';

/**
 * NoteList renders a grid of note cards with pin/archive/delete actions.
 * It expects to receive a list of notes already filtered/sorted by parent.
 */
// PUBLIC_INTERFACE
export default function NoteList({ notes }) {
  /** Render list of notes; clicking selects; actions stopPropagation to avoid selecting. */
  const {
    state: { selectedId },
    actions,
  } = useNotesStore();

  if (!Array.isArray(notes) || notes.length === 0) return null;

  return (
    <div className="note-list">
      {notes.map((n) => (
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
                aria-label={n.pinned ? 'Unpin note' : 'Pin note'}
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
                aria-label={n.archived ? 'Unarchive note' : 'Archive note'}
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
                aria-label="Delete note"
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
      ))}
    </div>
  );
}
