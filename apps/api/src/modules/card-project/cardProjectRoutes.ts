import type { FastifyInstance, FastifyPluginAsync } from "fastify";

import type { CardProjectService } from "./cardProjectService.js";

interface CardProjectRoutesOptions {
  service: CardProjectService;
}

interface CreateProjectBody {
  name: string;
}

interface DeleteProjectParams {
  id: string;
}

const createProjectBodySchema = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: { type: "string" },
  },
} as const;

export const cardProjectRoutes: FastifyPluginAsync<
  CardProjectRoutesOptions
> = async (app: FastifyInstance, options) => {
  const { service } = options;

  app.get("/projects", async () => ({
    projects: service.listCardProjects(),
  }));

  app.post<{ Body: CreateProjectBody }>(
    "/projects",
    { schema: { body: createProjectBodySchema } },
    async (request, reply) => {
      const project = service.createCardProject(request.body.name);
      return reply.status(201).send(project);
    },
  );

  app.delete<{ Params: DeleteProjectParams }>(
    "/projects/:id",
    async (request, reply) => {
      const deleted = service.deleteCardProject(request.params.id);

      if (!deleted) {
        return reply.status(404).send({
          error: { code: "NOT_FOUND", message: "Project not found." },
        });
      }

      return reply.status(204).send();
    },
  );
};
