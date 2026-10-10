import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { defineComponent, h } from "vue";
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

async function mountPanel(overrides: Partial<PanelProps> = {}) {
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
    global: {
      plugins: [router],
    },
  });

  return wrapper;
}

describe("ProjectFormPanel", () => {
  describe("form presentation", () => {
    it("renders the project details form", async () => {
      const wrapper = await mountPanel();

      expect(wrapper.get("h3").text()).toBe("Project details");
      expect(wrapper.get('label[for="project-name"]').text()).toBe(
        "Project name",
      );
      expect(wrapper.get("#project-name").exists()).toBe(true);
      expect(wrapper.get(".field-hint").text()).toContain(
        "recognize this project",
      );
    });

    it("shows the create-project action for a new project", async () => {
      const wrapper = await mountPanel();

      expect(wrapper.text()).toContain("Create project");
      expect(wrapper.text()).not.toContain("Save changes");
    });

    it("shows the save-changes action when editing", async () => {
      const wrapper = await mountPanel({
        isEditing: true,
      });

      expect(wrapper.text()).toContain("Save changes");
      expect(wrapper.text()).not.toContain("Create project");
    });

    it("displays the supplied project name", async () => {
      const wrapper = await mountPanel({
        name: "Photography studio",
      });

      expect(
        (wrapper.get("#project-name").element as HTMLInputElement).value,
      ).toBe("Photography studio");
    });
  });

  describe("loading and load errors", () => {
    it("shows a busy loading state without rendering the form", async () => {
      const wrapper = await mountPanel({
        isLoading: true,
      });

      const status = wrapper.get('[role="status"]');

      expect(status.text()).toBe("Loading project…");
      expect(status.attributes("aria-busy")).toBe("true");
      expect(wrapper.find("form").exists()).toBe(false);
    });

    it("shows the load error and a link back to projects", async () => {
      const wrapper = await mountPanel({
        loadError: "Project not found.",
      });

      expect(wrapper.get('[role="alert"]').text()).toBe("Project not found.");
      expect(wrapper.get("a").text()).toBe("Back to projects");
      expect(wrapper.get("a").attributes("href")).toBe("/projects");
      expect(wrapper.find("form").exists()).toBe(false);
    });
  });

  describe("field interaction", () => {
    it("emits a name update when the input changes", async () => {
      const wrapper = await mountPanel();

      await wrapper.get("#project-name").setValue("Updated cards");

      expect(wrapper.emitted("update:name")).toEqual([["Updated cards"]]);
    });

    it("clears the current error when the user edits the name", async () => {
      const wrapper = await mountPanel({
        formError: "Enter a project name.",
      });

      await wrapper.get("#project-name").setValue("Studio cards");

      expect(wrapper.emitted("clear-error")).toHaveLength(1);
    });

    it("marks the input invalid and associates its error message", async () => {
      const wrapper = await mountPanel({
        formError: "Enter a project name.",
      });

      const input = wrapper.get("#project-name");

      expect(input.attributes("aria-invalid")).toBe("true");
      expect(input.attributes("aria-describedby")).toBe("project-name-error");
      expect(wrapper.get("#project-name-error").text()).toBe(
        "Enter a project name.",
      );
      expect(wrapper.get("#project-name-error").attributes("role")).toBe(
        "alert",
      );
    });

    it("does not mark the input invalid when there is no form error", async () => {
      const wrapper = await mountPanel();

      const input = wrapper.get("#project-name");

      expect(input.attributes("aria-invalid")).toBe("false");
      expect(input.attributes("aria-describedby")).toBeUndefined();
      expect(wrapper.find("#project-name-error").exists()).toBe(false);
    });
  });

  describe("form actions", () => {
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
      const wrapper = await mountPanel({
        isSubmitting: true,
      });

      expect(
        (wrapper.get("#project-name").element as HTMLInputElement).disabled,
      ).toBe(true);

      const buttons = wrapper.findAll("button");

      expect(buttons).toHaveLength(2);
      expect(buttons.every((button) => button.element.disabled)).toBe(true);
    });

    it("shows the creating label while a new project is submitting", async () => {
      const wrapper = await mountPanel({
        isSubmitting: true,
      });

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
});
