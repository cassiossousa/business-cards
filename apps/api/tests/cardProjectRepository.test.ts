import type Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDatabase } from "../src/db/database.ts";
import {
  createCardProjectRepository,
  type CardProjectRepository,
} from "../src/modules/card-project/cardProjectRepository.ts";

let database: Database.Database;
let repository: CardProjectRepository;

beforeEach(() => {
  database = createDatabase(":memory:");
  repository = createCardProjectRepository(database);
});

afterEach(() => {
  database.close();
});

function insertProject(id: string, name: string, createdAt: string): void {
  database
    .prepare(
      `INSERT INTO projects (id, name, created_at)
       VALUES (?, ?, ?)`,
    )
    .run(id, name, createdAt);
}

describe("CardProjectRepository", () => {
  describe("create", () => {
    it("persists a project with a generated id and creation date", () => {
      const created = repository.create("Studio cards");

      expect(created.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(created.name).toBe("Studio cards");
      expect(Number.isNaN(Date.parse(created.createdAt))).toBe(false);
      expect(repository.getById(created.id)).toEqual(created);
    });
  });

  describe("getById", () => {
    it("returns null when a project does not exist", () => {
      expect(repository.getById("missing")).toBeNull();
    });
  });

  describe("list", () => {
    it("returns an empty list when there are no projects", () => {
      expect(repository.list()).toEqual([]);
    });

    it("returns the most recently created project first", () => {
      insertProject("older", "Older project", "2026-01-01T10:00:00.000Z");

      insertProject("newer", "Newer project", "2026-01-02T10:00:00.000Z");

      expect(repository.list()).toEqual([
        {
          id: "newer",
          name: "Newer project",
          createdAt: "2026-01-02T10:00:00.000Z",
        },
        {
          id: "older",
          name: "Older project",
          createdAt: "2026-01-01T10:00:00.000Z",
        },
      ]);
    });

    it("breaks created_at ties deterministically by id", () => {
      const timestamp = "2026-01-01T10:00:00.000Z";

      insertProject("a", "Project A", timestamp);
      insertProject("b", "Project B", timestamp);

      expect(repository.list().map((project) => project.id)).toEqual([
        "b",
        "a",
      ]);
    });
  });

  describe("updateName", () => {
    it("updates the name without changing the creation date", () => {
      const original = repository.create("Original name");

      const updated = repository.updateName(original.id, "Updated name");

      expect(updated).toEqual({
        ...original,
        name: "Updated name",
      });
    });

    it("returns null when updating an unknown id", () => {
      expect(repository.updateName("missing", "Updated name")).toBeNull();
    });
  });

  describe("delete", () => {
    it("removes an existing project and reports true", () => {
      const created = repository.create("Studio cards");

      expect(repository.delete(created.id)).toBe(true);
      expect(repository.getById(created.id)).toBeNull();
    });

    it("reports false for an unknown id", () => {
      expect(repository.delete("missing")).toBe(false);
    });
  });
});
