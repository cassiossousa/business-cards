import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDatabase } from "../src/db/database.js";
import { createCardProjectRepository } from "../src/modules/card-project/cardProjectRepository.js";
import { cardProjectRoutes } from "../src/modules/card-project/cardProjectRoutes.js";
import { createCardProjectService } from "../src/modules/card-project/cardProjectService.js";

let app: FastifyInstance;
let database: ReturnType<typeof createDatabase>;

beforeEach(async () => {
  database = createDatabase(":memory:");
  const service = createCardProjectService(
    createCardProjectRepository(database),
  );

  app = Fastify({ logger: false });
  await app.register(cardProjectRoutes, {
    prefix: "/api",
    service,
  });
  await app.ready();
});

afterEach(async () => {
  await app.close();
  database.close();
});

describe("card project routes", () => {
  it("creates and retrieves a project with a template and fields", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/api/projects",
      payload: {
        name: "QR portfolio",
        templateId: "qr-code",
        fields: {
          fullName: "Alex Morgan",
          email: "alex@example.com",
          qrUrl: "https://example.com",
        },
      },
    });

    expect(createResponse.statusCode).toBe(201);

    const created = createResponse.json<{
      id: string;
      templateId: string;
      fields: Record<string, string>;
    }>();

    expect(created.templateId).toBe("qr-code");
    expect(created.fields.qrUrl).toBe("https://example.com");

    const getResponse = await app.inject({
      method: "GET",
      url: `/api/projects/${created.id}`,
    });

    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json()).toEqual(created);
  });

  it("updates fields without changing the template", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/api/projects",
      payload: {
        name: "Portfolio",
        templateId: "qr-code",
        fields: {
          fullName: "Alex Morgan",
          qrUrl: "https://example.com",
        },
      },
    });

    const created = createResponse.json<{ id: string }>();
    const updateResponse = await app.inject({
      method: "PUT",
      url: `/api/projects/${created.id}`,
      payload: {
        name: "Updated portfolio",
        fields: {
          fullName: "Jordan Lee",
          qrUrl: "https://portfolio.example",
        },
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toMatchObject({
      name: "Updated portfolio",
      templateId: "qr-code",
      fields: {
        fullName: "Jordan Lee",
        qrUrl: "https://portfolio.example",
      },
    });
  });

  it("rejects a template update", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/api/projects",
      payload: {
        name: "Portfolio",
        templateId: "simple",
        fields: { fullName: "Alex Morgan" },
      },
    });

    const created = createResponse.json<{ id: string }>();
    const response = await app.inject({
      method: "PUT",
      url: `/api/projects/${created.id}`,
      payload: {
        name: "Portfolio",
        templateId: "qr-code",
        fields: { fullName: "Alex Morgan" },
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("rejects a QR field on the Simple template", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/projects",
      payload: {
        name: "Simple card",
        templateId: "simple",
        fields: {
          fullName: "Alex Morgan",
          qrUrl: "https://example.com",
        },
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("INVALID_CARD_FIELDS");
  });

  it("rejects unknown template IDs", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/projects",
      payload: {
        name: "Invalid",
        templateId: "unknown",
        fields: {},
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 404 when updating a missing project", async () => {
    const response = await app.inject({
      method: "PUT",
      url: "/api/projects/missing",
      payload: {
        name: "Missing project",
        fields: { fullName: "Nobody" },
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe("NOT_FOUND");
  });
});
