import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ApiError,
  createProject,
  deleteProject,
  listProjects,
} from "./projectsApi";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const fetchMock = vi.fn();

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("listProjects", () => {
  it("requests the projects endpoint and parses the response", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        projects: [
          { id: "p1", name: "Studio cards", createdAt: "2026-01-01T00:00:00Z" },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await listProjects();

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      "http://localhost:8787/api/projects",
      expect.objectContaining({ headers: { accept: "application/json" } }),
    );
    expect(result.projects).toHaveLength(1);
    expect(result.projects[0]?.name).toBe("Studio cards");
  });

  it("throws an ApiError with the server error code on failure", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(400, {
        error: { code: "INVALID_NAME", message: "Enter a project name." },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const failure = await listProjects().catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(ApiError);
    expect((failure as ApiError).code).toBe("INVALID_NAME");
    expect((failure as ApiError).message).toBe("Enter a project name.");
    expect((failure as ApiError).status).toBe(400);
  });

  it("throws a NETWORK ApiError when the server is unreachable", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    vi.stubGlobal("fetch", fetchMock);

    const failure = await listProjects().catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(ApiError);
    expect((failure as ApiError).code).toBe("NETWORK");
  });

  it("throws an UNKNOWN ApiError when the error body is not JSON", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("gateway timeout", { status: 502 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const failure = await listProjects().catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(ApiError);
    expect((failure as ApiError).code).toBe("UNKNOWN");
    expect((failure as ApiError).status).toBe(502);
  });
});

describe("createProject", () => {
  it("posts the name as JSON and returns the created project", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(201, {
        id: "p2",
        name: "Rounded corners",
        createdAt: "2026-02-01T00:00:00Z",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const project = await createProject("Rounded corners");

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      "http://localhost:8787/api/projects",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Rounded corners" }),
      }),
    );
    expect(project.id).toBe("p2");
  });
});

describe("deleteProject", () => {
  it("sends DELETE to the encoded project URL and tolerates the empty 204 body", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteProject("project id/1")).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      "http://localhost:8787/api/projects/project%20id%2F1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("throws a NOT_FOUND ApiError when the project does not exist", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(404, {
        error: { code: "NOT_FOUND", message: "Project not found." },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const failure = await deleteProject("missing").catch(
      (error: unknown) => error,
    );

    expect(failure).toBeInstanceOf(ApiError);
    expect((failure as ApiError).code).toBe("NOT_FOUND");
  });
});
