import { createDatabase } from "../src/db/database.js";
import { SqliteProjectRepository } from "../src/modules/card-project/cardProjectRepository.js";

import type Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";

let database: Database.Database;
let repository: SqliteProjectRepository;

beforeEach(() => {
  database = createDatabase(":memory:");
  repository = new SqliteProjectRepository(database);
});

describe("SqliteProjectRepository", () => {
  describe("create", () => {
    it("persists a project with a generated id and creation date", () => {
      const project = repository.create("Studio cards");

      expect(project.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      expect(project.name).toBe("Studio cards");
      expect(new Date(project.createdAt).toString()).not.toBe("Invalid Date");

      const row = database
        .prepare("SELECT id, name FROM projects WHERE id = ?")
        .get(project.id) as { id: string; name: string };
      expect(row).toEqual({ id: project.id, name: "Studio cards" });
    });
  });

  describe("list", () => {
    it("returns an empty list when there are no projects", () => {
      expect(repository.list()).toEqual([]);
    });

    it("returns the most recently created project first", () => {
      database
        .prepare("INSERT INTO projects (id, name, created_at) VALUES (?, ?, ?)")
        .run("a", "Oldest", "2026-01-01T00:00:00.000Z");
      database
        .prepare("INSERT INTO projects (id, name, created_at) VALUES (?, ?, ?)")
        .run("b", "Newest", "2026-02-01T00:00:00.000Z");

      const projects = repository.list();

      expect(projects.map((project) => project.name)).toEqual([
        "Newest",
        "Oldest",
      ]);
    });

    it("breaks created_at ties deterministically by id", () => {
      database
        .prepare("INSERT INTO projects (id, name, created_at) VALUES (?, ?, ?)")
        .run("zz", "Last by id", "2026-01-01T00:00:00.000Z");
      database
        .prepare("INSERT INTO projects (id, name, created_at) VALUES (?, ?, ?)")
        .run("aa", "First by id", "2026-01-01T00:00:00.000Z");

      const projects = repository.list();

      expect(projects.map((project) => project.id)).toEqual(["aa", "zz"]);
    });
  });

  describe("delete", () => {
    it("removes an existing project and reports true", () => {
      const project = repository.create("Studio cards");

      expect(repository.delete(project.id)).toBe(true);
      expect(repository.list()).toEqual([]);
    });

    it("reports false for an unknown id", () => {
      expect(repository.delete("missing-id")).toBe(false);
    });
  });
});
