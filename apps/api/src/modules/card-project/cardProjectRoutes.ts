import type { FastifyInstance, FastifyReply } from "fastify";

import {
  InvalidCardProjectFieldsError,
  InvalidCardProjectNameError,
  InvalidCardTemplateError,
  type CardProjectService,
} from "./cardProjectService.js";
import type { CardTemplateId } from "./cardProjectTypes.js";

interface RouteOptions {
  service: CardProjectService;
}

interface ProjectIdParams {
  id: string;
}

interface CreateProjectBody {
  name: string;
  templateId?: CardTemplateId;
  fields?: Record<string, string>;
}

interface UpdateProjectBody {
  name: string;
  fields?: Record<string, string>;
}

type DomainError =
  | InvalidCardProjectNameError
  | InvalidCardTemplateError
  | InvalidCardProjectFieldsError;

function notFound(reply: FastifyReply) {
  return reply.code(404).send({
    error: {
      code: "NOT_FOUND",
      message: "Project not found.",
    },
  });
}

function domainError(reply: FastifyReply, error: DomainError) {
  return reply.code(400).send({
    error: {
      code: error.code,
      message: error.message,
    },
  });
}

function isDomainError(error: unknown): error is DomainError {
  return (
    error instanceof InvalidCardProjectNameError ||
    error instanceof InvalidCardTemplateError ||
    error instanceof InvalidCardProjectFieldsError
  );
}

function hasTemplateId(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.hasOwnProperty.call(value, "templateId")
  );
}

const fieldsSchema = {
  type: "object",
  additionalProperties: {
    type: "string",
    maxLength: 200,
  },
} as const;

const createBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["name"],
  properties: {
    name: { type: "string", maxLength: 200 },
    templateId: {
      type: "string",
      enum: ["simple", "qr-code"],
    },
    fields: fieldsSchema,
  },
} as const;

const updateBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["name"],
  properties: {
    name: { type: "string", maxLength: 200 },
    fields: fieldsSchema,
  },
} as const;

export async function cardProjectRoutes(
  app: FastifyInstance,
  { service }: RouteOptions,
): Promise<void> {
  app.get("/projects", async () => ({
    projects: service.listCardProjects(),
  }));

  app.get<{ Params: ProjectIdParams }>(
    "/projects/:id",
    async (request, reply) => {
      const project = service.getCardProject(request.params.id);
      return project ?? notFound(reply);
    },
  );

  app.post<{ Body: CreateProjectBody }>(
    "/projects",
    { schema: { body: createBodySchema } },
    async (request, reply) => {
      try {
        const project = service.createCardProject(
          request.body.name,
          request.body.templateId,
          request.body.fields,
        );

        return reply.code(201).send(project);
      } catch (error) {
        if (isDomainError(error)) {
          return domainError(reply, error);
        }

        throw error;
      }
    },
  );

  app.put<{ Params: ProjectIdParams; Body: UpdateProjectBody }>(
    "/projects/:id",
    {
      schema: { body: updateBodySchema },
      preValidation: async (request, reply) => {
        if (hasTemplateId(request.body)) {
          return reply.code(400).send({
            error: {
              code: "TEMPLATE_IMMUTABLE",
              message: "The card template cannot be changed after creation.",
            },
          });
        }
      },
    },
    async (request, reply) => {
      try {
        const project = service.updateCardProject(
          request.params.id,
          request.body.name,
          request.body.fields,
        );

        return project ?? notFound(reply);
      } catch (error) {
        if (isDomainError(error)) {
          return domainError(reply, error);
        }

        throw error;
      }
    },
  );

  app.delete<{ Params: ProjectIdParams }>(
    "/projects/:id",
    async (request, reply) => {
      const deleted = service.deleteCardProject(request.params.id);

      return deleted ? reply.code(204).send() : notFound(reply);
    },
  );
}
