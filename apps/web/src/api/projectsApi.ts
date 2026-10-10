import type { CardProject, CardProjectListResponse } from "./types";

const apiOrigin =
  import.meta.env.VITE_API_ORIGIN?.replace(/\/$/, "") ??
  "http://localhost:8787";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

function toApiError(status: number, body: unknown): ApiError {
  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "object" &&
    body.error !== null &&
    "code" in body.error &&
    "message" in body.error &&
    typeof body.error.code === "string" &&
    typeof body.error.message === "string"
  ) {
    return new ApiError(body.error.code, body.error.message, status);
  }

  return new ApiError("UNKNOWN", "The request failed.", status);
}

async function parseErrorBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new ApiError("UNKNOWN", "The server response was invalid.", 500);
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${apiOrigin}${path}`, {
      headers: { accept: "application/json" },
      ...init,
    });
  } catch {
    throw new ApiError(
      "NETWORK",
      "Could not reach the server. Check that the API is running.",
      0,
    );
  }

  if (!response.ok) {
    throw toApiError(response.status, await parseErrorBody(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await parseJson(response)) as T;
}

export function listProjects(): Promise<CardProjectListResponse> {
  return requestJson<CardProjectListResponse>("/api/projects");
}

export async function createProject(name: string): Promise<CardProject> {
  return await requestJson<CardProject>("/api/projects", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export async function deleteProject(id: string): Promise<void> {
  await requestJson<void>(`/api/projects/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
