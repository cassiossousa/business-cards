import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { listProjects } from "./api/projectsApi";
import App from "./App.vue";
import { getThemePreference, setThemePreference } from "./theme/theme";

vi.mock("./api/projectsApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api/projectsApi")>();
  return {
    ...actual,
    listProjects: vi.fn(),
  };
});

vi.mock("./theme/theme", () => ({
  getThemePreference: vi.fn(() => "system"),
  setThemePreference: vi.fn(),
}));

const listProjectsMock = vi.mocked(listProjects);
const getThemePreferenceMock = vi.mocked(getThemePreference);
const setThemePreferenceMock = vi.mocked(setThemePreference);

beforeEach(() => {
  listProjectsMock.mockResolvedValue({ projects: [] });
  getThemePreferenceMock.mockReturnValue("system");
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("App", () => {
  it("renders the app header and hosts the projects page", async () => {
    const wrapper = mount(App);
    await flushPromises();

    expect(wrapper.find("h1").text()).toBe("Business Cards");
    expect(wrapper.text()).toContain("Create and manage your card projects");
    expect(wrapper.text()).toContain("No projects yet.");
  });

  it("offers light, dark, and system theme choices", async () => {
    getThemePreferenceMock.mockReturnValue("dark");
    const wrapper = mount(App);
    await flushPromises();

    const select = wrapper.get("select");
    const options = select.findAll("option");
    expect(options.map((option) => option.element.value)).toEqual([
      "light",
      "dark",
      "system",
    ]);
    expect((select.element as HTMLSelectElement).value).toBe("dark");
  });

  it("applies a theme change through setThemePreference", async () => {
    const wrapper = mount(App);
    await flushPromises();

    await wrapper.get("select").setValue("dark");

    expect(setThemePreferenceMock).toHaveBeenCalledWith("dark");
    expect((wrapper.get("select").element as HTMLSelectElement).value).toBe(
      "dark",
    );
  });
});
