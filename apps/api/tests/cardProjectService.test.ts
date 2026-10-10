import { describe, expect, it, vi } from "vitest";

import {
  createCardProjectService,
  InvalidCardProjectNameError,
  MAX_CARD_PROJECT_NAME_LENGTH,
} from "../src/modules/card-project/cardProjectService.ts";
import type {
  CardProject,
  CardProjectRepository,
} from "../src/modules/card-project/cardProjectRepository.ts";

const CREATED_AT = "2026-01-01T00:00:00.000Z";

function createProject(overrides: Partial<CardProject> = {}): CardProject {
  return {
    id: "p1",
    name: "Studio cards",
    createdAt: CREATED_AT,
    ...overrides,
  };
}

function createRecordingRepository() {
  const projects: CardProject[] = [];

  const repository: CardProjectRepository = {
    list: vi.fn(() => [...projects]),

    getById: vi.fn((id: string) => {
      return projects.find((project) => project.id === id) ?? null;
    }),

    create: vi.fn((name: string) => {
      const project = createProject({
        id: `p${projects.length + 1}`,
        name,
      });

      projects.push(project);

      return project;
    }),

    updateName: vi.fn((id: string, name: string) => {
      const index = projects.findIndex((project) => project.id === id);

      if (index === -1) {
        return null;
      }

      const existing = projects[index];

      if (!existing) {
        return null;
      }

      const updated: CardProject = {
        ...existing,
        name,
      };

      projects[index] = updated;

      return updated;
    }),

    delete: vi.fn((id: string) => {
      const index = projects.findIndex((project) => project.id === id);

      if (index === -1) {
        return false;
      }

      projects.splice(index, 1);

      return true;
    }),
  };

  return { repository, projects };
}

function createService() {
  const { repository, projects } = createRecordingRepository();

  return {
    service: createCardProjectService(repository),
    repository,
    projects,
  };
}

describe("CardProjectService", () => {
  describe("createCardProject", () => {
    it("stores the trimmed name", () => {
      const { service, repository } = createService();

      const created = service.createCardProject("  Studio cards  ");

      expect(created.name).toBe("Studio cards");
      expect(repository.create).toHaveBeenCalledExactlyOnceWith("Studio cards");
    });

    it("accepts a name of exactly 80 characters", () => {
      const { service, repository } = createService();
      const name = "x".repeat(MAX_CARD_PROJECT_NAME_LENGTH);

      const created = service.createCardProject(name);

      expect(created.name).toBe(name);
      expect(repository.create).toHaveBeenCalledExactlyOnceWith(name);
    });

    it("rejects an empty name", () => {
      const { service, repository } = createService();

      expect(() => service.createCardProject("")).toThrowError(
        InvalidCardProjectNameError,
      );

      expect(() => service.createCardProject("")).toThrowError(
        "Enter a project name.",
      );

      expect(repository.create).not.toHaveBeenCalled();
    });

    it("rejects a whitespace-only name", () => {
      const { service, repository } = createService();

      expect(() => service.createCardProject("   ")).toThrowError(
        "Enter a project name.",
      );

      expect(repository.create).not.toHaveBeenCalled();
    });

    it("rejects a name longer than 80 characters", () => {
      const { service, repository } = createService();

      expect(() =>
        service.createCardProject("x".repeat(MAX_CARD_PROJECT_NAME_LENGTH + 1)),
      ).toThrowError("CardProject names must be 80 characters or fewer.");

      expect(repository.create).not.toHaveBeenCalled();
    });

    it("rejects non-string names", () => {
      const { service, repository } = createService();

      expect(() => service.createCardProject(42)).toThrowError(
        "Project name must be a string.",
      );

      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe("listCardProjects", () => {
    it("returns the repository list", () => {
      const { service, repository, projects } = createService();
      projects.push(createProject());

      expect(service.listCardProjects()).toEqual([createProject()]);

      expect(repository.list).toHaveBeenCalledExactlyOnceWith();
    });
  });

  describe("getCardProject", () => {
    it("returns an existing project", () => {
      const { service, repository, projects } = createService();
      const existing = createProject();

      projects.push(existing);

      expect(service.getCardProject("p1")).toEqual(existing);
      expect(repository.getById).toHaveBeenCalledExactlyOnceWith("p1");
    });

    it("returns null for an unknown project", () => {
      const { service, repository } = createService();

      expect(service.getCardProject("missing")).toBeNull();

      expect(repository.getById).toHaveBeenCalledExactlyOnceWith("missing");
    });
  });

  describe("updateCardProject", () => {
    it("trims the name and delegates the update", () => {
      const { service, repository, projects } = createService();
      projects.push(createProject());

      const updated = service.updateCardProject("p1", "  Updated cards  ");

      expect(updated).toEqual(createProject({ name: "Updated cards" }));

      expect(repository.updateName).toHaveBeenCalledExactlyOnceWith(
        "p1",
        "Updated cards",
      );
    });

    it("returns null when the project does not exist", () => {
      const { service, repository } = createService();

      expect(service.updateCardProject("missing", "Updated cards")).toBeNull();

      expect(repository.updateName).toHaveBeenCalledExactlyOnceWith(
        "missing",
        "Updated cards",
      );
    });

    it("rejects invalid names without calling the repository", () => {
      const { service, repository } = createService();

      expect(() => service.updateCardProject("p1", "   ")).toThrowError(
        "Enter a project name.",
      );

      expect(repository.updateName).not.toHaveBeenCalled();
    });
  });

  describe("deleteCardProject", () => {
    it("delegates deletion and reports whether the project existed", () => {
      const { service, repository, projects } = createService();
      projects.push(createProject());

      expect(service.deleteCardProject("p1")).toBe(true);
      expect(service.deleteCardProject("missing")).toBe(false);

      expect(repository.delete).toHaveBeenNthCalledWith(1, "p1");
      expect(repository.delete).toHaveBeenNthCalledWith(2, "missing");
    });
  });
});
