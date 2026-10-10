import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import ProjectFormHeader from "./ProjectFormHeader.vue";

describe("ProjectFormHeader", () => {
  it("introduces the new-project workflow", () => {
    const wrapper = mount(ProjectFormHeader, {
      props: { isEditing: false },
    });

    expect(wrapper.get("h2").text()).toBe("New project");
    expect(wrapper.text()).toContain("choose a template");
  });

  it("introduces project editing without suggesting template selection", () => {
    const wrapper = mount(ProjectFormHeader, {
      props: { isEditing: true },
    });

    expect(wrapper.get("h2").text()).toBe("Edit project");
    expect(wrapper.text()).toContain("Update the project name");
  });
});
