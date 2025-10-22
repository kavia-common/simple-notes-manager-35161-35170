export function queryNoteListContainer() {
  // RTL prefers semantic roles; our grid is a div, so fallback to class query.
  return document.querySelector('.note-list');
}
