import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import type Database from "better-sqlite3";

import { createCardProjectRepository } from "./modules/card-project/cardProjectRepository.js";
import { cardProjectRoutes } from "./modules/card-project/cardProjectRoutes.js";
import { createCardProjectService } from "./modules/card-project/cardProjectService.js";

export interface BuildAppOptions {
  database: Database.Database;
  webOrigin?: string;
}

export function buildApp({
  database,
  webOrigin = "http://localhost:5173",
}: BuildAppOptions): FastifyInstance {
  const app = Fastify({
    logger: false,
    ajv: {
      customOptions: {
        coerceTypes: false,
        removeAdditional: false,
      },
    },
  });

  const repository = createCardProjectRepository(database);
  const service = createCardProjectService(repository);

  void app.register(cors, {
    origin: webOrigin,
    methods: ["GET", "HEAD", "POST", "PUT", "DELETE", "OPTIONS"],
  });

  app.setErrorHandler((error, request, reply) => {
    if (error.validation) {
      return reply.code(400).send({
        error: {
          code: "INVALID_REQUEST",
          message: error.message || "Request validation failed.",
        },
      });
    }

    if (error.statusCode === 400 || error.code === "FST_ERR_CTP_INVALID_JSON") {
      return reply.code(400).send({
        error: {
          code: "INVALID_REQUEST",
          message: "The request body is invalid.",
        },
      });
    }

    request.log.error(error);

    return reply.code(500).send({
      error: {
        code: "INTERNAL",
        message: "Something went wrong.",
      },
    });
  });

  app.setNotFoundHandler((_request, reply) => {
    return reply.code(404).send({
      error: {
        code: "NOT_FOUND",
        message: "Resource not found.",
      },
    });
  });

  app.get("/api/health", async () => ({ status: "ok" }));

  void app.register(cardProjectRoutes, {
    prefix: "/api",
    service,
  });

  app.addHook("onClose", async () => {
    database.close();
  });

  return app;
}
