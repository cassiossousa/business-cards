import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import AppInput from "./AppInput.vue";

describe("AppInput", () => {
  it("renders a text input with the given id and fallthrough attributes", () => {
    const wrapper = mount(AppInput, {
      props: { id: "project-name", modelValue: "" },
      attrs: {
        name: "project-name",
        placeholder: "e.g. Studio cards",
        autocomplete: "off",
      },
    });

    const input = wrapper.get("input").element as HTMLInputElement;
    expect(input.type).toBe("text");
    expect(input.id).toBe("project-name");
    expect(input.name).toBe("project-name");
    expect(input.placeholder).toBe("e.g. Studio cards");
    expect(input.autocomplete).toBe("off");
    expect(input.disabled).toBe(false);
  });

  it("emits the typed value through update:modelValue", async () => {
    const wrapper = mount(AppInput, {
      props: { id: "project-name", modelValue: "" },
    });

    await wrapper.get("input").setValue("Studio cards");

    expect(wrapper.emitted("update:modelValue")).toEqual([["Studio cards"]]);
  });

  it("reflects the modelValue and supports the disabled state", () => {
    const wrapper = mount(AppInput, {
      props: { id: "project-name", modelValue: "Draft", disabled: true },
    });

    const input = wrapper.get("input").element as HTMLInputElement;
    expect(input.value).toBe("Draft");
    expect(input.disabled).toBe(true);
  });
});
