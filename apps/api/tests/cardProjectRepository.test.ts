import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDatabase } from "../src/db/database.js";
import { createCardProjectRepository } from "../src/modules/card-project/cardProjectRepository.js";

let database: ReturnType<typeof createDatabase>;
let repository: ReturnType<typeof createCardProjectRepository>;

beforeEach(() => {
  database = createDatabase(":memory:");
  repository = createCardProjectRepository(database);
});

afterEach(() => {
  database.close();
});

describe("card project repository", () => {
  it("persists a project with its template and field values", () => {
    const created = repository.create("Portfolio", "qr-code", {
      fullName: "Alex Morgan",
      qrUrl: "https://example.com",
    });

    expect(repository.getById(created.id)).toEqual(created);
    expect(repository.list()).toContainEqual(created);
  });

  it("updates project fields without changing its template", () => {
    const created = repository.create("Portfolio", "qr-code", {
      fullName: "Alex Morgan",
      qrUrl: "https://example.com",
    });

    const updated = repository.update(created.id, "Updated portfolio", {
      fullName: "Jordan Lee",
      qrUrl: "https://portfolio.example",
    });

    expect(updated).toMatchObject({
      id: created.id,
      name: "Updated portfolio",
      templateId: "qr-code",
      fields: {
        fullName: "Jordan Lee",
        qrUrl: "https://portfolio.example",
      },
    });
  });

  it("returns null when updating a nonexistent project", () => {
    expect(
      repository.update("missing", "Unknown", { fullName: "Unknown" }),
    ).toBeNull();
  });

  it("deletes the project and its saved card document", () => {
    const created = repository.create("Temporary", "simple", {
      fullName: "Alex Morgan",
    });

    expect(repository.delete(created.id)).toBe(true);
    expect(repository.getById(created.id)).toBeNull();
    expect(repository.delete(created.id)).toBe(false);

    const remainingDocuments = database
      .prepare("SELECT project_id FROM card_project_documents")
      .all();

    expect(remainingDocuments).toEqual([]);
  });

  it("treats a preexisting project without a card document as Simple", () => {
    database
      .prepare("INSERT INTO projects (id, name, created_at) VALUES (?, ?, ?)")
      .run("legacy-project", "Older project", "2026-01-01T00:00:00.000Z");

    expect(repository.getById("legacy-project")).toMatchObject({
      id: "legacy-project",
      name: "Older project",
      templateId: "simple",
      fields: {
        fullName: "",
        role: "",
        email: "",
        phone: "",
        website: "",
      },
    });
  });
});
