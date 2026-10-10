import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import ProjectTemplateSummary from "./ProjectTemplateSummary.vue";

describe("ProjectTemplateSummary", () => {
  it("shows the chosen template and explains that it is fixed", () => {
    const wrapper = mount(ProjectTemplateSummary, {
      props: { templateName: "QR Code" },
    });

    expect(wrapper.text()).toContain("QR Code");
    expect(wrapper.text()).toContain("template is fixed");
    expect(wrapper.text()).toContain("update the card fields");
    expect(wrapper.find("input").exists()).toBe(false);
    expect(wrapper.find("select").exists()).toBe(false);
  });
});
