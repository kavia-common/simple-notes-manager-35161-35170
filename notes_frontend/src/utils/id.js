const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Generate a reasonably unique id using time and randomness.
 * Uses base62 encoding for compactness.
 */
// PUBLIC_INTERFACE
export function generateId(prefix = 'note') {
  /** Generate a unique ID string with an optional prefix. */
  const time = Date.now();
  const rand = cryptoRandom(8);
  const timeEncoded = baseEncode(time);
  return `${prefix}_${timeEncoded}_${rand}`;
}

function cryptoRandom(length) {
  // create a random string of given length from ALPHABET
  let result = '';
  // Use browser crypto if available
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint32Array(length);
    window.crypto.getRandomValues(arr);
    for (let i = 0; i < length; i++) {
      result += ALPHABET[arr[i] % ALPHABET.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      const r = Math.floor(Math.random() * ALPHABET.length);
      result += ALPHABET[r];
    }
  }
  return result;
}

function baseEncode(num) {
  let n = Math.floor(Math.abs(num));
  if (n === 0) return '0';
  let out = '';
  while (n > 0) {
    out = ALPHABET[n % ALPHABET.length] + out;
    n = Math.floor(n / ALPHABET.length);
  }
  return out;
}
