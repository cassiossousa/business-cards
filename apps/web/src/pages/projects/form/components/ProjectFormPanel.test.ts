import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { describe, expect, it } from "vitest";

import ProjectFormPanel from "./ProjectFormPanel.vue";

interface PanelProps {
  name: string;
  isEditing: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  loadError: string | null;
  formError: string | null;
}

const defaultProps: PanelProps = {
  name: "Studio cards",
  isEditing: false,
  isLoading: false,
  isSubmitting: false,
  loadError: null,
  formError: null,
};

const EmptyRoute = defineComponent({
  render: () => h("div"),
});

async function mountPanel(overrides: Partial<PanelProps> = {}, slotText = "") {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/projects",
        name: "projects",
        component: EmptyRoute,
      },
    ],
  });

  await router.push("/projects");
  await router.isReady();

  const wrapper = mount(ProjectFormPanel, {
    props: {
      ...defaultProps,
      ...overrides,
    },
    slots: {
      default: slotText,
    },
    global: {
      plugins: [router],
    },
  });

  return wrapper;
}

describe("ProjectFormPanel", () => {
  it("renders the project details form", async () => {
    const wrapper = await mountPanel();

    expect(wrapper.get("h3").text()).toBe("Project details");
    expect(wrapper.get('label[for="project-name"]').text()).toBe(
      "Project name",
    );
    expect(wrapper.get("#project-name").exists()).toBe(true);
  });

  it("renders its default slot inside the form", async () => {
    const wrapper = await mountPanel({}, "Card details editor");

    expect(wrapper.get("form").text()).toContain("Card details editor");
  });

  it("shows the create-project action for a new project", async () => {
    const wrapper = await mountPanel();

    expect(wrapper.text()).toContain("Create project");
    expect(wrapper.text()).not.toContain("Save changes");
  });

  it("shows the save-changes action when editing", async () => {
    const wrapper = await mountPanel({ isEditing: true });

    expect(wrapper.text()).toContain("Save changes");
    expect(wrapper.text()).not.toContain("Create project");
  });

  it("displays the supplied project name", async () => {
    const wrapper = await mountPanel({ name: "Photography studio" });

    expect(
      (wrapper.get("#project-name").element as HTMLInputElement).value,
    ).toBe("Photography studio");
  });

  it("shows a loading state without rendering the form", async () => {
    const wrapper = await mountPanel({ isLoading: true });

    expect(wrapper.get('[role="status"]').text()).toBe("Loading project…");
    expect(wrapper.find("form").exists()).toBe(false);
  });

  it("shows a load error and a link back to projects", async () => {
    const wrapper = await mountPanel({ loadError: "Project not found." });

    expect(wrapper.get('[role="alert"]').text()).toBe("Project not found.");
    expect(wrapper.get("a").text()).toBe("Back to projects");
    expect(wrapper.get("a").attributes("href")).toBe("/projects");
    expect(wrapper.find("form").exists()).toBe(false);
  });

  it("emits a name update when the input changes", async () => {
    const wrapper = await mountPanel();

    await wrapper.get("#project-name").setValue("Updated cards");

    expect(wrapper.emitted("update:name")).toEqual([["Updated cards"]]);
  });

  it("clears an existing error when the name changes", async () => {
    const wrapper = await mountPanel({
      formError: "Enter a project name.",
    });

    await wrapper.get("#project-name").setValue("Studio cards");

    expect(wrapper.emitted("clear-error")).toHaveLength(1);
  });

  it("marks the project-name input invalid when there is an error", async () => {
    const wrapper = await mountPanel({
      formError: "Enter a project name.",
    });

    const input = wrapper.get("#project-name");

    expect(input.attributes("aria-invalid")).toBe("true");
    expect(input.attributes("aria-describedby")).toBe("project-form-error");
    expect(wrapper.get("#project-form-error").text()).toBe(
      "Enter a project name.",
    );
  });

  it("emits submit when the form is submitted", async () => {
    const wrapper = await mountPanel();

    await wrapper.get("form").trigger("submit");

    expect(wrapper.emitted("submit")).toHaveLength(1);
  });

  it("emits cancel when Cancel is clicked", async () => {
    const wrapper = await mountPanel();
    const cancelButton = wrapper
      .findAll("button")
      .find((button) => button.text() === "Cancel");

    expect(cancelButton).toBeDefined();

    await cancelButton!.trigger("click");

    expect(wrapper.emitted("cancel")).toHaveLength(1);
    expect(wrapper.emitted("submit")).toBeUndefined();
  });

  it("disables the input and actions while submitting", async () => {
    const wrapper = await mountPanel({ isSubmitting: true });

    expect(
      (wrapper.get("#project-name").element as HTMLInputElement).disabled,
    ).toBe(true);
    expect(
      wrapper.findAll("button").every((button) => {
        return (button.element as HTMLButtonElement).disabled;
      }),
    ).toBe(true);
  });

  it("shows the creating label while a new project is submitting", async () => {
    const wrapper = await mountPanel({ isSubmitting: true });

    expect(wrapper.text()).toContain("Creating…");
  });

  it("shows the saving label while an existing project is submitting", async () => {
    const wrapper = await mountPanel({
      isEditing: true,
      isSubmitting: true,
    });

    expect(wrapper.text()).toContain("Saving…");
  });
});
