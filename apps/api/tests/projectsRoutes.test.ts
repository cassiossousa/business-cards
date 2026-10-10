import type Database from "better-sqlite3";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../src/app.js";
import { createDatabase } from "../src/db/database.js";

let database: Database.Database;
let app: FastifyInstance;

let corsDatabase: Database.Database;
let corsApp: FastifyInstance;

beforeAll(async () => {
  database = createDatabase(":memory:");
  app = await buildApp({ database });

  corsDatabase = createDatabase(":memory:");
  corsApp = await buildApp({
    database: corsDatabase,
    corsOrigin: "http://localhost:5173",
  });
});

afterAll(async () => {
  await app.close();
  database.close();
  await corsApp.close();
  corsDatabase.close();
});

describe("GET /api/projects", () => {
  it("returns an empty project list", async () => {
    const response = await app.inject({ method: "GET", url: "/api/projects" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ projects: [] });
  });

  it("returns created projects", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/projects",
      payload: { name: "Listed project" },
    });
    const project = created.json() as { id: string; name: string };

    const response = await app.inject({ method: "GET", url: "/api/projects" });

    expect(response.statusCode).toBe(200);
    const body = response.json() as {
      projects: Array<{ id: string; name: string }>;
    };
    expect(body.projects.map((item) => item.id)).toContain(project.id);
  });
});

describe("POST /api/projects", () => {
  it("creates a project with the trimmed name", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/projects",
      payload: { name: "  Rounded corners  " },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json() as {
      id: string;
      name: string;
      createdAt: string;
    };
    expect(body.name).toBe("Rounded corners");
    expect(body.id).toBeTruthy();
    expect(new Date(body.createdAt).toString()).not.toBe("Invalid Date");
  });

  it("accepts a name of exactly 80 characters", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/projects",
      payload: { name: "b".repeat(80) },
    });

    expect(response.statusCode).toBe(201);
  });

  it("rejects an empty name with INVALID_NAME", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/projects",
      payload: { name: "   " },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: { code: "INVALID_NAME", message: "Enter a project name." },
    });
  });

  it("rejects an over-long name with INVALID_NAME", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/projects",
      payload: { name: "b".repeat(81) },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: "INVALID_NAME",
        message: "CardProject names must be 80 characters or fewer.",
      },
    });
  });

  it("rejects a body without a name", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/projects",
      payload: {},
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: "INVALID_REQUEST",
        message: expect.stringContaining("name"),
      },
    });
  });

  it("rejects a non-string name", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/projects",
      payload: { name: 42 },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: "INVALID_REQUEST",
        message: expect.any(String),
      },
    });
  });

  it("rejects unknown properties", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/projects",
      payload: { name: "Studio cards", unexpected: "value" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: "INVALID_REQUEST",
        message: expect.any(String),
      },
    });
  });

  it("rejects malformed JSON", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/projects",
      headers: { "content-type": "application/json" },
      payload: "{ not valid json",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: { code: "INVALID_REQUEST", message: expect.any(String) },
    });
  });
});

describe("DELETE /api/projects/:id", () => {
  it("deletes an existing project", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/projects",
      payload: { name: "Delete me" },
    });
    const { id } = created.json() as { id: string };

    const deleted = await app.inject({
      method: "DELETE",
      url: `/api/projects/${id}`,
    });
    expect(deleted.statusCode).toBe(204);

    const listed = await app.inject({ method: "GET", url: "/api/projects" });
    const body = listed.json() as { projects: Array<{ id: string }> };
    expect(body.projects.map((project) => project.id)).not.toContain(id);
  });

  it("returns NOT_FOUND for an unknown id", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: "/api/projects/does-not-exist",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: { code: "NOT_FOUND", message: "Project not found." },
    });
  });
});

describe("unknown routes", () => {
  it("returns the shared NOT_FOUND error shape", async () => {
    const response = await app.inject({ method: "GET", url: "/api/nope" });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: { code: "NOT_FOUND", message: "Resource not found." },
    });
  });
});

describe("CORS", () => {
  it("allows the configured origin and every method the API exposes", async () => {
    const response = await corsApp.inject({
      method: "OPTIONS",
      url: "/api/projects",
      headers: {
        origin: "http://localhost:5173",
        "access-control-request-method": "DELETE",
        "access-control-request-headers": "content-type",
      },
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5173",
    );
    expect(response.headers["access-control-allow-methods"]).toContain(
      "DELETE",
    );
  });

  it("exposes the API to cross-origin GET requests from the configured origin", async () => {
    const response = await corsApp.inject({
      method: "GET",
      url: "/api/projects",
      headers: { origin: "http://localhost:5173" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5173",
    );
  });
});
