import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNotesStore } from '../store/useNotesStore';

/**
 * NoteEditor allows editing the currently selected note's title and content.
 * It performs debounced autosave to the store to avoid excessive updates.
 */
// PUBLIC_INTERFACE
export default function NoteEditor() {
  /** Edit area for selected note with debounced autosave on title/content changes. */
  const {
    state: { notes, selectedId },
    actions,
  } = useNotesStore();

  const selected = useMemo(() => notes.find((n) => n.id === selectedId) || null, [notes, selectedId]);

  // Local state mirrors note fields for controlled inputs
  const [title, setTitle] = useState(selected?.title || '');
  const [content, setContent] = useState(selected?.content || '');

  // Sync local state when selection changes
  useEffect(() => {
    setTitle(selected?.title || '');
    setContent(selected?.content || '');
  }, [selectedId, selected?.title, selected?.content]);

  // Debounce save
  const saveTimer = useRef(null);
  const DEBOUNCE_MS = 400;

  useEffect(() => {
    if (!selected) return;

    // schedule save on changes
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      // Only persist if something actually changed compared to store
      if (title !== selected.title || content !== selected.content) {
        actions.updateNote(selected.id, { title, content });
      }
    }, DEBOUNCE_MS);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [title, content, selected, actions]);

  if (!selected) {
    return (
      <div className="empty" aria-live="polite">
        <div className="empty-illustration">✍️</div>
        <div className="empty-title">Select a note to edit</div>
        <div className="empty-subtitle">Or create a new one from the top bar.</div>
      </div>
    );
  }

  return (
    <section className="content-inner" aria-label="Editor">
      <div className="field">
        <label className="field-label" htmlFor="note-title">Title</label>
        <input
          id="note-title"
          className="input"
          type="text"
          placeholder="Note title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="note-content">Content</label>
        <textarea
          id="note-content"
          className="input"
          placeholder="Start typing..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          style={{ resize: 'vertical' }}
        />
      </div>

      <div className="toolbar">
        <div className="toolbar-left muted">
          Last updated: {new Date(selected.updatedAt).toLocaleString()}
        </div>
        <div className="toolbar-right">
          <button
            className="btn"
            onClick={() => actions.togglePin(selected.id)}
            aria-label={selected.pinned ? 'Unpin note' : 'Pin note'}
            title={selected.pinned ? 'Unpin' : 'Pin'}
          >
            {selected.pinned ? '📌 Unpin' : '📍 Pin'}
          </button>
          <button
            className="btn"
            onClick={() => actions.toggleArchive(selected.id)}
            aria-label={selected.archived ? 'Unarchive note' : 'Archive note'}
            title={selected.archived ? 'Unarchive' : 'Archive'}
          >
            {selected.archived ? '🗂️ Unarchive' : '📦 Archive'}
          </button>
          <button
            className="btn"
            onClick={() => {
              const id = selected.id;
              actions.deleteNote(id);
            }}
            aria-label="Delete note"
            title="Delete"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </section>
  );
}
