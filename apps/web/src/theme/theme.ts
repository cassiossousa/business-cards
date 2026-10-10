export type ThemePreference = "light" | "dark" | "system";
export type EffectiveTheme = "light" | "dark";

const STORAGE_KEY = "theme";
const PREFERENCES: readonly ThemePreference[] = ["light", "dark", "system"];

let preference: ThemePreference = "system";
let mediaQuery: MediaQueryList | null = null;
let initialized = false;

function systemTheme(): EffectiveTheme {
  mediaQuery ??= window.matchMedia("(prefers-color-scheme: dark)");
  return mediaQuery.matches ? "dark" : "light";
}

function readStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return PREFERENCES.find((value) => value === stored) ?? "system";
  } catch {
    // Storage can be unavailable (private browsing); fall back to system.
    return "system";
  }
}

function applyTheme(): void {
  const effective: EffectiveTheme =
    preference === "system" ? systemTheme() : preference;
  document.documentElement.dataset.theme = effective;
}

function handleSystemChange(): void {
  if (preference === "system") {
    applyTheme();
  }
}

export function getThemePreference(): ThemePreference {
  return preference;
}

export function setThemePreference(next: ThemePreference): void {
  preference = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Keep the in-memory choice even when persistence is unavailable.
  }
  applyTheme();
}

export function initTheme(): void {
  if (initialized) {
    return;
  }
  initialized = true;
  mediaQuery ??= window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", handleSystemChange);
  preference = readStoredPreference();
  applyTheme();
}
