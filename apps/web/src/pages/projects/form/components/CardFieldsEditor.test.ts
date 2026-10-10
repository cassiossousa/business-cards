import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import CardFieldsEditor from "./CardFieldsEditor.vue";

const simpleFields = {
  fullName: "Alex Morgan",
  role: "Creative Developer",
  email: "alex@example.com",
  phone: "+55 11 99999-0000",
  website: "example.com",
};

describe("CardFieldsEditor", () => {
  it("renders only fields declared by the Simple template", () => {
    const wrapper = mount(CardFieldsEditor, {
      props: {
        templateId: "simple",
        modelValue: simpleFields,
      },
    });

    expect(wrapper.get("#card-field-fullName").exists()).toBe(true);
    expect(wrapper.get("#card-field-email").exists()).toBe(true);
    expect(wrapper.find("#card-field-qrUrl").exists()).toBe(false);
  });

  it("renders the QR destination for the QR Code template", () => {
    const wrapper = mount(CardFieldsEditor, {
      props: {
        templateId: "qr-code",
        modelValue: {
          ...simpleFields,
          qrUrl: "https://example.com",
        },
      },
    });

    expect(wrapper.get('label[for="card-field-qrUrl"]').text()).toBe(
      "QR code destination",
    );
    expect(
      (wrapper.get("#card-field-qrUrl").element as HTMLInputElement).value,
    ).toBe("https://example.com");
    expect(wrapper.text()).toContain("Updating the URL changes its content");
  });

  it("emits an updated field object when a value changes", async () => {
    const wrapper = mount(CardFieldsEditor, {
      props: {
        templateId: "simple",
        modelValue: simpleFields,
      },
    });

    await wrapper.get("#card-field-fullName").setValue("Jordan Lee");

    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([
      {
        ...simpleFields,
        fullName: "Jordan Lee",
      },
    ]);
  });

  it("disables every field when requested", () => {
    const wrapper = mount(CardFieldsEditor, {
      props: {
        templateId: "qr-code",
        modelValue: { ...simpleFields, qrUrl: "https://example.com" },
        disabled: true,
      },
    });

    expect(
      wrapper.findAll(".field input").every((input) => {
        return (input.element as HTMLInputElement).disabled;
      }),
    ).toBe(true);
  });
});
