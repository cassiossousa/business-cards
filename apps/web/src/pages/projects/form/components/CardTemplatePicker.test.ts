import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import CardTemplatePicker from "./CardTemplatePicker.vue";

describe("CardTemplatePicker", () => {
  it("offers Simple and QR Code", () => {
    const wrapper = mount(CardTemplatePicker, {
      props: { modelValue: "simple" },
    });

    expect(wrapper.text()).toContain("Simple");
    expect(wrapper.text()).toContain("QR Code");
    expect(wrapper.findAll('input[name="card-template"]')).toHaveLength(2);
  });

  it("checks the currently selected template", () => {
    const wrapper = mount(CardTemplatePicker, {
      props: { modelValue: "qr-code" },
    });

    expect(
      (wrapper.get("#template-qr-code").element as HTMLInputElement).checked,
    ).toBe(true);
    expect(
      (wrapper.get("#template-simple").element as HTMLInputElement).checked,
    ).toBe(false);
  });

  it("emits a template selection when the user changes it", async () => {
    const wrapper = mount(CardTemplatePicker, {
      props: { modelValue: "simple" },
    });

    await wrapper.get("#template-qr-code").trigger("change");

    expect(wrapper.emitted("update:modelValue")).toEqual([["qr-code"]]);
  });

  it("disables selection when the picker is disabled", () => {
    const wrapper = mount(CardTemplatePicker, {
      props: { modelValue: "simple", disabled: true },
    });

    expect(
      wrapper.findAll('input[name="card-template"]').every((input) => {
        return (input.element as HTMLInputElement).disabled;
      }),
    ).toBe(true);
  });
});
