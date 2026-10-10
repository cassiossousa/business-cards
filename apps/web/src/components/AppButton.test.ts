import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import AppButton from "./AppButton.vue";

describe("AppButton", () => {
  it("renders its slot content", () => {
    const wrapper = mount(AppButton, {
      slots: { default: "Create project" },
    });

    expect(wrapper.text()).toBe("Create project");
  });

  it("defaults to a primary button with type button", () => {
    const wrapper = mount(AppButton);

    expect(wrapper.classes()).toContain("btn");
    expect(wrapper.classes()).toContain("btn-primary");
    expect(wrapper.attributes("type")).toBe("button");
  });

  it.each([
    ["primary", "btn-primary"],
    ["secondary", "btn-secondary"],
    ["danger", "btn-danger"],
    ["danger-solid", "btn-danger-solid"],
  ] as const)("applies the %s variant", (variant, className) => {
    const wrapper = mount(AppButton, {
      props: { variant },
    });

    expect(wrapper.classes()).toContain(className);
  });

  it("supports native button types", () => {
    const wrapper = mount(AppButton, {
      props: { type: "submit" },
    });

    expect(wrapper.attributes("type")).toBe("submit");
  });

  it("supports the disabled state", () => {
    const wrapper = mount(AppButton, {
      props: { disabled: true },
    });

    expect(wrapper.element.disabled).toBe(true);
  });

  it("forwards accessibility attributes", () => {
    const wrapper = mount(AppButton, {
      attrs: {
        "aria-label": "Confirm project deletion",
      },
    });

    expect(wrapper.attributes("aria-label")).toBe("Confirm project deletion");
  });

  it("forwards click listeners", async () => {
    const onClick = vi.fn();

    const wrapper = mount(AppButton, {
      attrs: { onClick },
    });

    await wrapper.trigger("click");

    expect(onClick).toHaveBeenCalledOnce();
  });
});
