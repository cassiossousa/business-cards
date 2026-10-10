import { vi } from "vitest";

const scrollToMock = vi.fn();

Object.defineProperty(window, "scrollTo", {
  configurable: true,
  writable: true,
  value: scrollToMock,
});

vi.stubGlobal("scrollTo", scrollToMock);
