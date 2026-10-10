import type Database from "better-sqlite3";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { buildApp } from "../src/app.ts";
import { createDatabase } from "../src/db/database.ts";
import type { CardProject } from "../src/modules/card-project/cardProjectRepository.ts";

let database: Database.Database;
let app: FastifyInstance;

beforeEach(async () => {
  database = createDatabase(":memory:");

  app = await buildApp({
    database,
    corsOrigin: "http://localhost:5173",
  });
});

afterEach(async () => {
  await app.close();
  database.close();
});

describe("Card project editing routes", () => {
  async function createProject(name: string): Promise<CardProject> {
    const response = await app.inject({
      method: "POST",
      url: "/api/projects",
      payload: { name },
    });

    expect(response.statusCode).toBe(201);

    return response.json<CardProject>();
  }

  it("retrieves an existing project by ID", async () => {
    const created = await createProject("Studio cards");

    const response = await app.inject({
      method: "GET",
      url: `/api/projects/${created.id}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json<CardProject>()).toEqual(created);
  });

  it("returns 404 when retrieving a project that does not exist", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/projects/missing",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Project not found.",
      },
    });
  });

  it("updates a project's name and preserves its creation date", async () => {
    const created = await createProject("Studio cards");

    const response = await app.inject({
      method: "PUT",
      url: `/api/projects/${created.id}`,
      payload: {
        name: "  Studio redesign  ",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json<CardProject>()).toEqual({
      ...created,
      name: "Studio redesign",
    });

    const getResponse = await app.inject({
      method: "GET",
      url: `/api/projects/${created.id}`,
    });

    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json<CardProject>()).toEqual({
      ...created,
      name: "Studio redesign",
    });
  });

  it("returns 404 when updating a project that does not exist", async () => {
    const response = await app.inject({
      method: "PUT",
      url: "/api/projects/missing",
      payload: {
        name: "Studio redesign",
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Project not found.",
      },
    });

    const listResponse = await app.inject({
      method: "GET",
      url: "/api/projects",
    });

    expect(listResponse.json<{ projects: CardProject[] }>().projects).toEqual(
      [],
    );
  });

  it("rejects an empty updated name using the shared API error format", async () => {
    const created = await createProject("Studio cards");

    const response = await app.inject({
      method: "PUT",
      url: `/api/projects/${created.id}`,
      payload: {
        name: "   ",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: "INVALID_NAME",
        message: "Enter a project name.",
      },
    });

    const getResponse = await app.inject({
      method: "GET",
      url: `/api/projects/${created.id}`,
    });

    expect(getResponse.json<CardProject>()).toEqual(created);
  });

  it("rejects an updated name longer than 80 characters", async () => {
    const created = await createProject("Studio cards");

    const response = await app.inject({
      method: "PUT",
      url: `/api/projects/${created.id}`,
      payload: {
        name: "x".repeat(81),
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json<{ error: { code: string } }>().error.code).toBe(
      "INVALID_NAME",
    );
  });
});
