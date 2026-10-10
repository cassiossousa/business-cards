import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type Database from "better-sqlite3";
import { afterAll, describe, expect, it } from "vitest";

import { createDatabase } from "../src/db/database.js";

const tempDirectory = mkdtempSync(join(tmpdir(), "business-cards-"));

afterAll(() => {
  rmSync(tempDirectory, { recursive: true, force: true });
});

describe("createDatabase", () => {
  it("applies all migrations to a fresh database", () => {
    const database = createDatabase(":memory:");

    const applied = database
      .prepare("SELECT id FROM schema_migrations ORDER BY id")
      .all() as Array<{ id: string }>;

    expect(applied.map((row) => row.id)).toEqual(["001-create-projects"]);

    const projects = database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all() as Array<{ name: string }>;
    expect(projects.map((row) => row.name)).toContain("projects");

    database.close();
  });

  it("reuses an existing database without reapplying migrations or losing data", () => {
    const filePath = join(tempDirectory, "existing.db");

    const first = createDatabase(filePath);
    first
      .prepare("INSERT INTO projects (id, name, created_at) VALUES (?, ?, ?)")
      .run("fixed-id", "Kept project", "2026-01-01T00:00:00.000Z");
    first.close();

    const second: Database.Database = createDatabase(filePath);
    const project = second
      .prepare("SELECT id, name FROM projects WHERE id = 'fixed-id'")
      .get() as { id: string; name: string };

    expect(project).toEqual({ id: "fixed-id", name: "Kept project" });

    const migrationCount = second
      .prepare("SELECT COUNT(*) AS count FROM schema_migrations")
      .get() as { count: number };
    expect(migrationCount.count).toBe(1);

    second.close();
  });

  it("enables foreign key enforcement", () => {
    const database = createDatabase(":memory:");

    expect(database.pragma("foreign_keys", { simple: true })).toBe(1);

    database.close();
  });
});
