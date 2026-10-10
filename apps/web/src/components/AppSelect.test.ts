import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import AppSelect from "./AppSelect.vue";

describe("AppSelect", () => {
  it("renders slotted options and reflects modelValue", () => {
    const wrapper = mount(AppSelect, {
      props: { id: "theme-select", modelValue: "dark" },
      slots: {
        default:
          '<option value="light">Light</option><option value="dark">Dark</option>',
      },
    });

    const select = wrapper.get("select").element as HTMLSelectElement;
    expect(select.id).toBe("theme-select");
    expect(select.value).toBe("dark");
    expect(select.options).toHaveLength(2);
  });

  it("emits the chosen value through update:modelValue", async () => {
    const wrapper = mount(AppSelect, {
      props: { id: "theme-select", modelValue: "system" },
      slots: {
        default:
          '<option value="light">Light</option><option value="dark">Dark</option>',
      },
    });

    await wrapper.get("select").setValue("light");

    expect(wrapper.emitted("update:modelValue")).toEqual([["light"]]);
  });

  it("supports the disabled state", () => {
    const wrapper = mount(AppSelect, {
      props: { id: "theme-select", modelValue: "system", disabled: true },
    });

    expect((wrapper.get("select").element as HTMLSelectElement).disabled).toBe(
      true,
    );
  });
});
