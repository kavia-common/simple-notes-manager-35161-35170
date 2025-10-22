import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { loadFromStorage, saveToStorage } from './storage';
import { generateId } from '../utils/id';

// Types and initial state
const initialState = {
  notes: [], // {id, title, content, createdAt, updatedAt, pinned, archived, tags?: string[]}
  selectedId: null,
  query: '',
  // Default sort: updatedAt desc
  sort: { by: 'updatedAt', order: 'desc' }, // by: createdAt|updatedAt|title, order: asc|desc
  // Default filter: active (not archived), all (not only pinned)
  filter: { showArchived: false, showPinnedOnly: false },
  // UI preferences persisted; theme is handled in App but saved here for centralization
  preferences: {
    theme: 'light',
  },
};

// Actions
const ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  TOGGLE_PIN: 'TOGGLE_PIN',
  TOGGLE_ARCHIVE: 'TOGGLE_ARCHIVE',
  SELECT: 'SELECT',
  SET_QUERY: 'SET_QUERY',
  SET_SORT: 'SET_SORT',
  SET_FILTER: 'SET_FILTER',
  BULK_DELETE: 'BULK_DELETE',
  IMPORT_NOTES: 'IMPORT_NOTES',
  EXPORT_NOTES: 'EXPORT_NOTES', // no-op in reducer, handled by selector/helper
  HYDRATE: 'HYDRATE',
  SET_PREFERENCE: 'SET_PREFERENCE',
};

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.HYDRATE: {
      const incoming = action.payload || {};
      return {
        ...state,
        ...incoming,
        sort: { ...(state.sort || {}), ...(incoming.sort || {}) },
        filter: { ...(state.filter || {}), ...(incoming.filter || {}) },
        preferences: { ...(state.preferences || {}), ...(incoming.preferences || {}) },
      };
    }
    case ACTIONS.CREATE: {
      const now = Date.now();
      const newNote = {
        id: generateId(),
        title: action.payload?.title || '',
        content: action.payload?.content || '',
        createdAt: now,
        updatedAt: now,
        pinned: !!action.payload?.pinned,
        archived: !!action.payload?.archived,
        tags: Array.isArray(action.payload?.tags) ? action.payload.tags : [],
      };
      const notes = [newNote, ...state.notes];
      return { ...state, notes, selectedId: newNote.id };
    }
    case ACTIONS.UPDATE: {
      const { id, updates } = action.payload || {};
      const notes = state.notes.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
      );
      return { ...state, notes };
    }
    case ACTIONS.DELETE: {
      const { id } = action.payload || {};
      const notes = state.notes.filter((n) => n.id !== id);
      const selectedId = state.selectedId === id ? null : state.selectedId;
      return { ...state, notes, selectedId };
    }
    case ACTIONS.BULK_DELETE: {
      const { ids } = action.payload || { ids: [] };
      const idSet = new Set(ids);
      const notes = state.notes.filter((n) => !idSet.has(n.id));
      const selectedId = idSet.has(state.selectedId) ? null : state.selectedId;
      return { ...state, notes, selectedId };
    }
    case ACTIONS.TOGGLE_PIN: {
      const { id } = action.payload || {};
      const notes = state.notes.map((n) =>
        n.id === id ? { ...n, pinned: !n.pinned, updatedAt: Date.now() } : n
      );
      return { ...state, notes };
    }
    case ACTIONS.TOGGLE_ARCHIVE: {
      const { id } = action.payload || {};
      const notes = state.notes.map((n) =>
        n.id === id ? { ...n, archived: !n.archived, updatedAt: Date.now() } : n
      );
      return { ...state, notes };
    }
    case ACTIONS.SELECT: {
      return { ...state, selectedId: action.payload?.id ?? null };
    }
    case ACTIONS.SET_QUERY: {
      return { ...state, query: action.payload?.query ?? '' };
    }
    case ACTIONS.SET_SORT: {
      const sort = action.payload?.sort || { by: 'updatedAt', order: 'desc' };
      return { ...state, sort };
    }
    case ACTIONS.SET_FILTER: {
      const filter = { ...state.filter, ...(action.payload?.filter || {}) };
      return { ...state, filter };
    }
    case ACTIONS.SET_PREFERENCE: {
      const { key, value } = action.payload || {};
      const preferences = { ...(state.preferences || {}), [key]: value };
      return { ...state, preferences };
    }
    case ACTIONS.IMPORT_NOTES: {
      const incoming = Array.isArray(action.payload?.notes) ? action.payload.notes : [];
      // Normalize notes and avoid id collisions by reassigning ids if missing
      const normalized = incoming
        .filter(Boolean)
        .map((n) => ({
          id: n.id || generateId(),
          title: n.title || '',
          content: n.content || '',
          createdAt: typeof n.createdAt === 'number' ? n.createdAt : Date.now(),
          updatedAt: typeof n.updatedAt === 'number' ? n.updatedAt : Date.now(),
          pinned: !!n.pinned,
          archived: !!n.archived,
          tags: Array.isArray(n.tags) ? n.tags : [],
        }));
      // Merge existing and imported; prefer imported as most recent
      const byId = new Map();
      for (const n of state.notes) byId.set(n.id, n);
      for (const n of normalized) byId.set(n.id, n);
      return { ...state, notes: Array.from(byId.values()) };
    }
    default:
      return state;
  }
}

const NotesContext = createContext(null);

/**
 * Provider with persistence
 */
// PUBLIC_INTERFACE
export function NotesProvider({ children, initial }) {
  /** React provider for notes store with persistence. */
  const [state, dispatch] = useReducer(reducer, initialState);

  // hydrate from storage once
  useEffect(() => {
    const persisted = loadFromStorage();
    if (persisted) {
      dispatch({ type: ACTIONS.HYDRATE, payload: persisted });
    } else if (initial && typeof initial === 'object') {
      dispatch({ type: ACTIONS.HYDRATE, payload: initial });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist on state changes
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  // action creators
  const actions = useMemo(
    () => ({
      // PUBLIC_INTERFACE
      createNote: (payload) => dispatch({ type: ACTIONS.CREATE, payload }),
      // PUBLIC_INTERFACE
      updateNote: (id, updates) => dispatch({ type: ACTIONS.UPDATE, payload: { id, updates } }),
      // PUBLIC_INTERFACE
      deleteNote: (id) => dispatch({ type: ACTIONS.DELETE, payload: { id } }),
      // PUBLIC_INTERFACE
      togglePin: (id) => dispatch({ type: ACTIONS.TOGGLE_PIN, payload: { id } }),
      // PUBLIC_INTERFACE
      toggleArchive: (id) => dispatch({ type: ACTIONS.TOGGLE_ARCHIVE, payload: { id } }),
      // PUBLIC_INTERFACE
      selectNote: (id) => dispatch({ type: ACTIONS.SELECT, payload: { id } }),
      // PUBLIC_INTERFACE
      setQuery: (query) => dispatch({ type: ACTIONS.SET_QUERY, payload: { query } }),
      // PUBLIC_INTERFACE
      setSort: (sort) => dispatch({ type: ACTIONS.SET_SORT, payload: { sort } }),
      // PUBLIC_INTERFACE
      setFilter: (filter) => dispatch({ type: ACTIONS.SET_FILTER, payload: { filter } }),
      // PUBLIC_INTERFACE
      bulkDelete: (ids) => dispatch({ type: ACTIONS.BULK_DELETE, payload: { ids } }),
      // PUBLIC_INTERFACE
      importNotes: (notes) => dispatch({ type: ACTIONS.IMPORT_NOTES, payload: { notes } }),
      // PUBLIC_INTERFACE
      exportNotes: () => {
        /** Return a serializable export of notes array. */
        return state.notes;
      },
      // PUBLIC_INTERFACE
      setPreference: (key, value) => dispatch({ type: ACTIONS.SET_PREFERENCE, payload: { key, value } }),
    }),
    [state]
  );

  const value = useMemo(() => ({ state, actions }), [state, actions]);

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

/**
 * Hook to access the notes store.
 */
// PUBLIC_INTERFACE
export function useNotesStore() {
  /** Accessor hook for notes state and actions. */
  const ctx = useContext(NotesContext);
  if (!ctx) {
    throw new Error('useNotesStore must be used within a NotesProvider');
  }
  return ctx;
}
