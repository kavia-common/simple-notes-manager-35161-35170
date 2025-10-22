/**
 * Theme utilities for Ocean Professional styling
 */

export const THEMES = {
  light: 'light',
  dark: 'dark',
};

// PUBLIC_INTERFACE
export function applyTheme(theme) {
  /** Apply a theme to document root via data-theme attribute. */
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

// PUBLIC_INTERFACE
export function getSystemPreferredTheme() {
  /** Detect system preferred color scheme. */
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.dark : THEMES.light;
  }
  return THEMES.light;
}
