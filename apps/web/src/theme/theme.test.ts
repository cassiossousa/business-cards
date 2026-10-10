import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ThemeModule = typeof import("./theme");

function stubMatchMedia(initialDark: boolean) {
  const listeners = new Set<() => void>();
  const mediaQuery = {
    matches: initialDark,
    addEventListener: (_type: string, listener: () => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: () => void) => {
      listeners.delete(listener);
    },
  };
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue(mediaQuery));
  return {
    setDark(dark: boolean) {
      mediaQuery.matches = dark;
      for (const listener of listeners) {
        listener();
      }
    },
  };
}

async function loadTheme(): Promise<ThemeModule> {
  vi.resetModules();
  return import("./theme");
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("theme", () => {
  it("follows a light OS theme when nothing is stored", async () => {
    stubMatchMedia(false);
    const theme = await loadTheme();

    theme.initTheme();

    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("follows a dark OS theme when nothing is stored", async () => {
    stubMatchMedia(true);
    const theme = await loadTheme();

    theme.initTheme();

    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("prefers a stored explicit choice over the OS theme", async () => {
    stubMatchMedia(false);
    localStorage.setItem("theme", "dark");
    const theme = await loadTheme();

    theme.initTheme();

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(theme.getThemePreference()).toBe("dark");
  });

  it("treats an unknown stored value as system", async () => {
    const media = stubMatchMedia(true);
    localStorage.setItem("theme", "banana");
    const theme = await loadTheme();

    theme.initTheme();
    expect(document.documentElement.dataset.theme).toBe("dark");

    media.setDark(false);
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("persists and applies an explicit choice", async () => {
    stubMatchMedia(false);
    const theme = await loadTheme();
    theme.initTheme();

    theme.setThemePreference("dark");

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(theme.getThemePreference()).toBe("dark");
  });

  it("keeps the applied choice when storage rejects writes", async () => {
    stubMatchMedia(false);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });
    const theme = await loadTheme();
    theme.initTheme();

    theme.setThemePreference("dark");

    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("reacts to OS theme changes while following the system", async () => {
    const media = stubMatchMedia(false);
    const theme = await loadTheme();
    theme.initTheme();

    media.setDark(true);

    expect(document.documentElement.dataset.theme).toBe("dark");

    media.setDark(false);
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("ignores OS theme changes while an explicit choice is active", async () => {
    const media = stubMatchMedia(false);
    const theme = await loadTheme();
    theme.initTheme();

    theme.setThemePreference("light");
    media.setDark(true);

    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
