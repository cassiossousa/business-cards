import { describe, expect, it } from "vitest";

import type {
  CardProject,
  CardProjectRepository,
} from "../src/modules/card-project/cardProjectRepository.js";
import {
  CardProjectService,
  InvalidCardProjectNameError,
} from "../src/modules/card-project/cardProjectService.js";

class RecordingProjectRepository implements CardProjectRepository {
  readonly projects: CardProject[] = [];
  readonly deletedIds: string[] = [];
  private nextId = 1;

  list(): CardProject[] {
    return this.projects;
  }

  create(name: string): CardProject {
    const project: CardProject = {
      id: `project-${this.nextId}`,
      name,
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    this.nextId += 1;
    this.projects.push(project);
    return project;
  }

  delete(id: string): boolean {
    this.deletedIds.push(id);
    const index = this.projects.findIndex((project) => project.id === id);
    if (index === -1) {
      return false;
    }
    this.projects.splice(index, 1);
    return true;
  }
}

function createService(): {
  service: CardProjectService;
  repository: RecordingProjectRepository;
} {
  const repository = new RecordingProjectRepository();
  return { service: new CardProjectService(repository), repository };
}

describe("CardProjectService", () => {
  describe("createCardProject", () => {
    it("stores the trimmed name", () => {
      const { service, repository } = createService();

      const project = service.createCardProject("  Studio cards  ");

      expect(project.name).toBe("Studio cards");
      expect(repository.projects).toHaveLength(1);
    });

    it("accepts a name of exactly 80 characters", () => {
      const { service } = createService();
      const name = "a".repeat(80);

      const project = service.createCardProject(name);

      expect(project.name).toBe(name);
    });

    it("rejects an empty name", () => {
      const { service, repository } = createService();

      expect(() => service.createCardProject("")).toThrow(
        InvalidCardProjectNameError,
      );
      expect(() => service.createCardProject("")).toThrow(
        "Enter a project name.",
      );
      expect(repository.projects).toHaveLength(0);
    });

    it("rejects a whitespace-only name", () => {
      const { service, repository } = createService();

      expect(() => service.createCardProject("   \t  ")).toThrow(
        InvalidCardProjectNameError,
      );
      expect(repository.projects).toHaveLength(0);
    });

    it("rejects a name longer than 80 characters", () => {
      const { service, repository } = createService();

      expect(() => service.createCardProject("a".repeat(81))).toThrow(
        InvalidCardProjectNameError,
      );
      expect(() => service.createCardProject("a".repeat(81))).toThrow(
        "80 characters or fewer",
      );
      expect(repository.projects).toHaveLength(0);
    });
  });

  describe("listCardProjects", () => {
    it("returns the repository list", () => {
      const { service } = createService();
      service.createCardProject("First");

      expect(service.listCardProjects()).toHaveLength(1);
      expect(service.listCardProjects()[0]?.name).toBe("First");
    });
  });

  describe("deleteCardProject", () => {
    it("delegates deletion and reports whether the project existed", () => {
      const { service, repository } = createService();
      const project = service.createCardProject("First");

      expect(service.deleteCardProject(project.id)).toBe(true);
      expect(service.deleteCardProject(project.id)).toBe(false);
      expect(repository.deletedIds).toEqual([project.id, project.id]);
    });
  });
});
