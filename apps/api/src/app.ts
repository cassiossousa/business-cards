import cors from "@fastify/cors";
import type Database from "better-sqlite3";
import Fastify, { type FastifyError, type FastifyInstance } from "fastify";

import {
  CardProjectService,
  InvalidCardProjectNameError,
} from "./modules/card-project/cardProjectService.js";
import { SqliteProjectRepository } from "./modules/card-project/cardProjectRepository.js";
import { cardProjectRoutes } from "./modules/card-project/cardProjectRoutes.js";

export interface AppOptions {
  database: Database.Database;
  corsOrigin?: string;
  logger?: boolean;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export async function buildApp(options: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? false,
    ajv: {
      customOptions: {
        // Fastify's defaults silently coerce values (e.g. 42 -> "42") and
        // strip unknown properties. Reject them instead so the API contract
        // stays strict at the trust boundary.
        coerceTypes: false,
        removeAdditional: false,
      },
    },
  });

  if (options.corsOrigin) {
    void app.register(cors, {
      origin: options.corsOrigin,
      // @fastify/cors defaults to "GET,HEAD,POST", which would block DELETE
      // preflights; declare exactly the methods this API exposes.
      methods: ["GET", "POST", "DELETE"],
    });
  }

  const service = new CardProjectService(
    new SqliteProjectRepository(options.database),
  );

  app.setNotFoundHandler(async (_request, reply) => {
    return await reply.status(404).send({
      error: { code: "NOT_FOUND", message: "Resource not found." },
    });
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof InvalidCardProjectNameError) {
      return reply
        .status(400)
        .send({ error: { code: "INVALID_NAME", message: error.message } });
    }

    const status = error.statusCode ?? 500;

    if (status >= 500) {
      request.log.error(error);
      return reply.status(500).send({
        error: { code: "INTERNAL", message: "Something went wrong." },
      });
    }

    const code = status === 404 ? "NOT_FOUND" : "INVALID_REQUEST";
    return reply
      .status(status)
      .send({ error: { code, message: error.message } });
  });

  void app.register(cardProjectRoutes, { prefix: "/api", service });

  await app.ready();
  return app;
}
