import cors from "@fastify/cors";
import type Database from "better-sqlite3";
import Fastify, { type FastifyError, type FastifyInstance } from "fastify";

import { createCardProjectRepository } from "./modules/card-project/cardProjectRepository.ts";
import { cardProjectRoutes } from "./modules/card-project/cardProjectRoutes.ts";
import {
  createCardProjectService,
  InvalidCardProjectNameError,
} from "./modules/card-project/cardProjectService.ts";

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
        // Reject implicit type coercion and unknown properties.
        coerceTypes: false,
        removeAdditional: false,
      },
    },
  });

  if (options.corsOrigin) {
    void app.register(cors, {
      origin: options.corsOrigin,
      methods: ["GET", "HEAD", "POST", "PUT", "DELETE"],
    });
  }

  const repository = createCardProjectRepository(options.database);

  const service = createCardProjectService(repository);

  app.setNotFoundHandler(async (_request, reply) => {
    return reply.status(404).send({
      error: {
        code: "NOT_FOUND",
        message: "Resource not found.",
      },
    });
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof InvalidCardProjectNameError) {
      return reply.status(400).send({
        error: {
          code: "INVALID_NAME",
          message: error.message,
        },
      });
    }

    const status = error.statusCode ?? 500;

    if (status >= 500) {
      request.log.error(error);

      return reply.status(500).send({
        error: {
          code: "INTERNAL",
          message: "Something went wrong.",
        },
      });
    }

    const code = status === 404 ? "NOT_FOUND" : "INVALID_REQUEST";

    return reply.status(status).send({
      error: {
        code,
        message: error.message,
      },
    });
  });

  void app.register(cardProjectRoutes, {
    prefix: "/api",
    service,
  });

  await app.ready();

  return app;
}
