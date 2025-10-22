import React from 'react';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import App from './App';

// Mock localStorage to ensure isolation and to assert interactions
const store = {};
const localStorageMock = {
  getItem: jest.fn((key) => (key in store ? store[key] : null)),
  setItem: jest.fn((key, value) => {
    store[key] = value;
  }),
  removeItem: jest.fn((key) => {
    delete store[key];
  }),
  clear: jest.fn(() => {
    Object.keys(store).forEach((k) => delete store[k]);
  }),
};

beforeAll(() => {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });
});

beforeEach(() => {
  jest.useFakeTimers();
  localStorageMock.clear();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

function getNewNoteButton() {
  // TopNav renders "+ New Note"
  return screen.getByRole('button', { name: /new note/i });
}

function getEditorTitleInput() {
  return screen.getByLabelText(/title/i);
}

function getEditorContentTextarea() {
  return screen.getByLabelText(/content/i);
}

test('shows "+ New Note" button in top navigation', () => {
  render(<App />);
  expect(getNewNoteButton()).toBeInTheDocument();
});

test('clicking "+ New Note" creates a note and reveals the editor', () => {
  render(<App />);
  // Initially empty state message visible
  expect(screen.getByText(/no notes yet/i)).toBeInTheDocument();

  fireEvent.click(getNewNoteButton());

  // List should render at least one note card and editor should be shown
  // Editor has labeled fields
  expect(getEditorTitleInput()).toBeInTheDocument();
  expect(getEditorContentTextarea()).toBeInTheDocument();

  // NoteList shows a card with default title "New note" or "Untitled"
  // Main title in card should reflect created title "New note"
  // Fallback "Untitled" is used in NoteList when title is empty, but we create with "New note".
  const noteCards = screen.getAllByRole('button', { name: /pin note|unpin note/i }).map((btn) => btn.closest('.note-card'));
  expect(noteCards.length).toBeGreaterThan(0);
});

test('debounced autosave updates list title/snippet after editing fields', () => {
  render(<App />);
  fireEvent.click(getNewNoteButton());

  const titleInput = getEditorTitleInput();
  const contentTextarea = getEditorContentTextarea();

  fireEvent.change(titleInput, { target: { value: 'My First Note' } });
  fireEvent.change(contentTextarea, { target: { value: 'Some interesting content goes here' } });

  // Advance timers beyond NoteEditor.DEBOUNCE_MS (400ms)
  act(() => {
    jest.advanceTimersByTime(450);
  });

  // The note card in the list should now reflect the updated title and snippet
  // Find note list container
  const noteList = screen.getByRole('grid', { hidden: true }) || document.querySelector('.note-list');
  expect(noteList).toBeTruthy();
  const listUtils = within(noteList);
  expect(listUtils.getByText(/my first note/i)).toBeInTheDocument();
  expect(listUtils.getByText(/some interesting content/i)).toBeInTheDocument();

  // localStorage should have been written due to persistence effect
  expect(window.localStorage.setItem).toHaveBeenCalled();
});

test('pin toggle works from editor and reflects in list card button state', () => {
  render(<App />);
  fireEvent.click(getNewNoteButton());

  // Editor pin button toggles between "📍 Pin" and "📌 Unpin" via aria-label
  let pinButton = screen.getByRole('button', { name: /pin note/i });
  expect(pinButton).toBeInTheDocument();

  // Click to pin
  fireEvent.click(pinButton);

  // After debounced state persistence, but pin is immediate in reducer; no timer needed for pin
  // Find the card's icon button reflecting the pinned state (aria-label "Unpin note")
  const cardUnpinBtn = screen.getByRole('button', { name: /unpin note/i });
  expect(cardUnpinBtn).toBeInTheDocument();

  // Clicking again unpins
  fireEvent.click(screen.getByRole('button', { name: /unpin note/i }));
  expect(screen.getByRole('button', { name: /pin note/i })).toBeInTheDocument();
});

test('storage load/save interactions occur (mocked localStorage)', () => {
  render(<App />);

  // Creating a note should trigger persistence soon after state change
  fireEvent.click(getNewNoteButton());

  // Advance timers to allow any debounced effects to flush (editor update uses debounce; persistence effect is on any state change)
  act(() => {
    jest.advanceTimersByTime(500);
  });

  // Set on save should be called at least once
  expect(window.localStorage.setItem).toHaveBeenCalled();

  // Simulate re-render fresh app; ensure getItem is called to hydrate
  // Reset the calls but keep stored data
  const persistedCalls = window.localStorage.setItem.mock.calls.length;
  expect(persistedCalls).toBeGreaterThan(0);

  // Re-render another instance to simulate a page reload using existing mocked storage content
  render(<App />);

  // loadFromStorage should call getItem during provider hydrate
  expect(window.localStorage.getItem).toHaveBeenCalled();
});
