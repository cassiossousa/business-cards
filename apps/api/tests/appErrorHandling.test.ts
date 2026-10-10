import type Database from "better-sqlite3";
import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";

import { buildApp } from "../src/app.ts";
import { createDatabase } from "../src/db/database.ts";

let database: Database.Database | undefined;
let app: FastifyInstance | undefined;

async function startApp(
  options: {
    corsOrigin?: string;
    logger?: boolean;
  } = {},
): Promise<void> {
  database = createDatabase(":memory:");
  app = await buildApp({
    database,
    ...options,
  });
}

afterEach(async () => {
  if (app) {
    await app.close();
    app = undefined;
  }

  if (database?.open) {
    database.close();
  }

  database = undefined;
});

describe("buildApp error handling", () => {
  it("starts and serves routes when no CORS origin is configured", async () => {
    await startApp();

    const response = await app!.inject({
      method: "GET",
      url: "/api/projects",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      projects: [],
    });
  });

  it("uses the shared error handler for invalid project names", async () => {
    await startApp({
      corsOrigin: "http://localhost:5173",
    });

    const response = await app!.inject({
      method: "POST",
      url: "/api/projects",
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
  });

  it("returns a generic 500 response for unexpected database errors", async () => {
    await startApp();

    database!.exec(`
      CREATE TRIGGER fail_project_insert
      BEFORE INSERT ON projects
      BEGIN
        SELECT RAISE(ABORT, 'Forced insert failure');
      END;
    `);

    const response = await app!.inject({
      method: "POST",
      url: "/api/projects",
      payload: {
        name: "Trigger failure",
      },
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      error: {
        code: "INTERNAL",
        message: "Something went wrong.",
      },
    });
  });
});
