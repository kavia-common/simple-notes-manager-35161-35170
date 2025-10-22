# Notes Frontend (Simple Notes)

This document describes the features and usage of the Simple Notes frontend, including how data is stored locally, how the Ocean Professional theme is applied, available keyboard shortcuts, and how to run, test, export, and import notes.

## Overview

The app is a single-page React application for creating, editing, and managing notes. It presents a top navigation bar with search and quick actions, a sidebar for filters and sorting, and a main content area that lists notes and displays an editor for the selected note. The UI follows a clean, modern aesthetic based on the Ocean Professional theme.

## Features

- Create, edit, pin, archive, and delete notes with an inline editor.
- Debounced autosave in the editor to avoid excessive updates (400 ms delay).
- Persistent local storage with versioned keys to keep notes across page reloads.
- Search by title or content directly from the top navigation.
- Filter views for All, Pinned, and Archived notes using sidebar chips.
- Sorting by Updated, Created, or Title in ascending/descending order.
- Light/Dark mode toggle with preference persistence.
- Import from and Export to JSON directly from the toolbar.
- Responsive layout with collapsible filters on small screens.

## Local Persistence

Data is stored in the browser’s localStorage using a versioned key. The provider hydrates from storage on startup and saves after any state change.

- Storage key: simple-notes:notes:v1 (from src/store/storage.js)
- Load and save:
  - Hydration: src/store/useNotesStore.js calls loadFromStorage() once at mount.
  - Persistence: A useEffect saves the entire store state to localStorage on every state change via saveToStorage().
- Safety: JSON parsing/stringifying is wrapped with fallbacks to prevent runtime errors.

Developers can reference:
- src/store/storage.js for getStorageKey, loadFromStorage, saveToStorage.
- src/store/useNotesStore.js for hydration and persistence effects.

## Ocean Professional Theme

The UI theme is defined using CSS custom properties and a data-theme attribute on the document root. Light and dark variants are supported.

- Theme tokens are declared in src/App.css under the “Ocean Professional Theme Tokens” section. Primary is #2563EB (blue-600), secondary is #F59E0B (amber-500), error is #EF4444.
- Light mode tokens are defined under :root and dark mode overrides under [data-theme="dark"].
- The app applies the theme using src/utils/theme.js:
  - getSystemPreferredTheme() reads the OS color scheme preference.
  - applyTheme(theme) sets document.documentElement’s data-theme attribute.
- The top navigation offers a theme toggle button, and the preference is persisted in the notes store (src/store/useNotesStore.js via actions.setPreference('theme', theme)) so your choice is remembered.

## Keyboard Shortcuts

- New note: Press Enter on the “+ New Note” button if focused. The app does not define global keyboard handlers; standard browser keyboard navigation and form input shortcuts apply.
- Search: Focus the search field and type to filter notes by title or content in real time.
- Editor: Use standard text input shortcuts (Ctrl/Cmd+Z to undo, Ctrl/Cmd+A to select all, etc.). Edits autosave after 400 ms of inactivity.

Note: There are no app-wide registered hotkeys beyond typical form controls.

## How to Run

- Development server:
  - npm start
  - Opens http://localhost:3000 and hot-reloads on changes.

- Production build:
  - npm run build
  - Outputs an optimized build to the build/ directory.

Requirements:
- Node.js compatible with react-scripts 5.
- The app depends only on react, react-dom, and react-scripts.

## How to Test

Unit tests cover core UI behaviors including new note creation, editor autosave, pin toggling, and localStorage interactions.

- Run in CI/non-interactive:
  - CI=true npm test -- --watchAll=false

- Run interactively:
  - npm test

Tests are implemented with React Testing Library and jest-dom. See:
- src/App.test.js for end-to-end-like UI behavior tests.
- src/setupTests.js which imports @testing-library/jest-dom.
- TESTING_README.md for a quick summary of coverage and commands.

## Using the App

### Creating a Note
Click “+ New Note” in the top navigation. A note is created with the default title “New note,” selected automatically, and the editor is shown.

### Editing a Note
Use the Title input and Content textarea. Changes are debounced and saved to the store after 400 ms of inactivity. The note list title and snippet update after the save occurs.

### Pinning, Archiving, Deleting
- From the editor toolbar, use Pin/Unpin, Archive/Unarchive, and Delete actions.
- From the note card, use the icon buttons to Pin/Unpin, Archive/Unarchive, or Delete without opening the editor.

### Filtering and Sorting
Open the sidebar filters to switch among All, Pinned, and Archived. Use the “Sort by” select to change default sorting (Updated, Created, Title; both ascending and descending).

### Search
Type in the top navigation search box to filter notes by title or content. Filters and search are combined with sorting to control the list.

## Export and Import

The toolbar includes “Export” and “Import” for JSON-based backup/restore.

- Export:
  - Click Export to download notes-export.json containing the currently visible notes list (after filters and search). This is a simple array of note objects with fields like id, title, content, createdAt, updatedAt, pinned, archived, and optional tags.

- Import:
  - Click Import and choose a JSON file. The app accepts:
    - A bare array of notes: [ { ...note }, ... ]
    - An object with a notes property: { "notes": [ { ...note }, ... ] }
  - Imported notes are normalized and merged. Missing ids are generated; timestamps default to now if not present. Existing ids are overwritten by imported notes with the same id.

Tip: To import a file previously exported, you can use it directly with no changes.

## Project Structure

- src/App.js: App shell, layout, theme application, export/import controls.
- src/components/Layout/TopNav.js: Brand, search, New Note button, theme toggle.
- src/components/Layout/Sidebar.js: Filters and sorting UI with responsive behavior.
- src/components/NoteList.js: Note grid with card actions.
- src/components/NoteEditor.js: Editor with debounced autosave and toolbar actions.
- src/store/useNotesStore.js: Centralized state, reducer, actions, hydration, and persistence.
- src/store/storage.js: Versioned localStorage helpers and safety wrappers.
- src/utils/theme.js: Theme utilities (apply and detect).
- src/App.css: Ocean Professional theme tokens and component styles.

## Accessibility and Responsiveness

- Inputs and buttons include accessible labels and roles where appropriate.
- The sidebar becomes collapsible on small screens. The grid adapts note card columns to available width.

## Troubleshooting

- If you see no notes after a refresh, ensure localStorage is not blocked and that the browser’s privacy settings allow site data.
- If theme does not switch, confirm document root has data-theme set and that CSS variables are applied; try toggling the theme button again.
- If import fails silently, verify the JSON format is an array or an object with a notes property.

