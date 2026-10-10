import type { FastifyPluginAsync } from "fastify";

import type { CardProjectService } from "./cardProjectService.ts";

interface CardProjectRouteOptions {
  service: CardProjectService;
}

interface CardProjectIdParams {
  id: string;
}

interface CardProjectNameBody {
  name: string;
}

const cardProjectNameBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["name"],
  properties: {
    name: {
      type: "string",
      maxLength: 200,
    },
  },
} as const;

export const cardProjectRoutes: FastifyPluginAsync<
  CardProjectRouteOptions
> = async (app, { service }) => {
  app.get("/projects", async () => ({
    projects: service.listCardProjects(),
  }));

  app.get<{ Params: CardProjectIdParams }>(
    "/projects/:id",
    async (request, reply) => {
      const project = service.getCardProject(request.params.id);

      if (project === null) {
        return reply.status(404).send({
          error: {
            code: "NOT_FOUND",
            message: "Project not found.",
          },
        });
      }

      return project;
    },
  );

  app.post<{ Body: CardProjectNameBody }>(
    "/projects",
    {
      schema: {
        body: cardProjectNameBodySchema,
      },
    },
    async (request, reply) => {
      const project = service.createCardProject(request.body.name);

      return reply.status(201).send(project);
    },
  );

  app.put<{
    Params: CardProjectIdParams;
    Body: CardProjectNameBody;
  }>(
    "/projects/:id",
    {
      schema: {
        body: cardProjectNameBodySchema,
      },
    },
    async (request, reply) => {
      const project = service.updateCardProject(
        request.params.id,
        request.body.name,
      );

      if (project === null) {
        return reply.status(404).send({
          error: {
            code: "NOT_FOUND",
            message: "Project not found.",
          },
        });
      }

      return project;
    },
  );

  app.delete<{ Params: CardProjectIdParams }>(
    "/projects/:id",
    async (request, reply) => {
      const deleted = service.deleteCardProject(request.params.id);

      if (!deleted) {
        return reply.status(404).send({
          error: {
            code: "NOT_FOUND",
            message: "Project not found.",
          },
        });
      }

      return reply.status(204).send();
    },
  );
};
