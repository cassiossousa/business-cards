import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import ProjectListState from "./ProjectListState.vue";

describe("ProjectListState", () => {
  it("keeps the loading state quiet before the delay expires", () => {
    const wrapper = mount(ProjectListState, {
      props: {
        kind: "loading",
        showLoadingState: false,
      },
    });

    expect(wrapper.get("[aria-busy]").exists()).toBe(true);
    expect(wrapper.find(".skeleton-list").exists()).toBe(false);
    expect(wrapper.text()).not.toContain("Loading projects…");
  });

  it("shows the skeleton and status after the loading delay", () => {
    const wrapper = mount(ProjectListState, {
      props: {
        kind: "loading",
        showLoadingState: true,
      },
    });

    expect(wrapper.findAll(".skeleton-list li")).toHaveLength(3);
    expect(wrapper.get('[role="status"]').text()).toBe("Loading projects…");
    expect(wrapper.find(".skeleton-list").attributes("aria-hidden")).toBe(
      "true",
    );
  });

  it("renders the empty state", () => {
    const wrapper = mount(ProjectListState, {
      props: {
        kind: "empty",
      },
    });

    expect(wrapper.text()).toContain("No projects yet.");
    expect(wrapper.find(".skeleton-list").exists()).toBe(false);
  });

  it("renders the error state and emits retry", async () => {
    const wrapper = mount(ProjectListState, {
      props: {
        kind: "error",
      },
    });

    expect(wrapper.text()).toContain("Could not load your projects.");

    await wrapper.get("button").trigger("click");

    expect(wrapper.emitted("retry")).toHaveLength(1);
  });
});
