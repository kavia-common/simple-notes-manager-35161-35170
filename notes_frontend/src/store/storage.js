const STORAGE_VERSION = 1;
const STORAGE_PREFIX = 'simple-notes';
const STORAGE_KEY = `${STORAGE_PREFIX}:notes:v${STORAGE_VERSION}`;

/**
 * Safely parse JSON with fallback
 * @param {string} text
 * @param {any} fallback
 * @returns {any}
 */
function safeParse(text, fallback = null) {
  try {
    if (typeof text !== 'string') return fallback;
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

/**
 * Safely stringify JSON with fallback
 * @param {any} value
 * @param {string} fallback
 * @returns {string}
 */
function safeStringify(value, fallback = '{}') {
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}

// PUBLIC_INTERFACE
export function getStorageKey() {
  /** Returns the current storage key including versioning. */
  return STORAGE_KEY;
}

// PUBLIC_INTERFACE
export function loadFromStorage() {
  /** Load app data from localStorage with versioning support. Returns null if nothing or invalid. */
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const data = safeParse(raw, null);
    // ensure shape is object
    if (data && typeof data === 'object') {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

// PUBLIC_INTERFACE
export function saveToStorage(data) {
  /** Persist app data to localStorage (versioned key). Returns true/false */
  try {
    const raw = safeStringify(data, '{}');
    window.localStorage.setItem(STORAGE_KEY, raw);
    return true;
  } catch {
    return false;
  }
}

// PUBLIC_INTERFACE
export function clearStorage() {
  /** Clears the current versioned storage key. */
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
