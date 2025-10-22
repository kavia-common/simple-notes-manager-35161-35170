# Notes Frontend - Test Coverage and Usage

This document summarizes the core UI behavior tests and how to run them.

## What is covered

- Presence of "+ New Note" button in the TopNav.
- Creating a note reveals the editor panel.
- Debounced autosave (400ms) updates the note title and content snippet in the list.
- Pin toggle behavior from the editor is reflected in the note card.
- LocalStorage interactions are mocked and asserted (save on state change, load on hydration).

## How to run

- Non-interactive (CI):
  CI=true npm test -- --watchAll=false

- Local interactive:
  npm test

All tests use React Testing Library and jest-dom.
