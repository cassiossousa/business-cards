import type {
  CardProject,
  CardProjectRepository,
} from "./cardProjectRepository.ts";

export const MAX_CARD_PROJECT_NAME_LENGTH = 80;

export class InvalidCardProjectNameError extends Error {
  readonly code = "INVALID_PROJECT_NAME";

  constructor(message: string) {
    super(message);
    this.name = "InvalidCardProjectNameError";
  }
}

function normalizeCardProjectName(value: unknown): string {
  if (typeof value !== "string") {
    throw new InvalidCardProjectNameError("Project name must be a string.");
  }

  const name = value.trim();

  if (name.length === 0) {
    throw new InvalidCardProjectNameError("Enter a project name.");
  }

  if (name.length > MAX_CARD_PROJECT_NAME_LENGTH) {
    throw new InvalidCardProjectNameError(
      "CardProject names must be 80 characters or fewer.",
    );
  }

  return name;
}

export interface CardProjectService {
  listCardProjects(): CardProject[];
  getCardProject(id: string): CardProject | null;
  createCardProject(name: unknown): CardProject;
  updateCardProject(id: string, name: unknown): CardProject | null;
  deleteCardProject(id: string): boolean;
}

export function createCardProjectService(
  repository: CardProjectRepository,
): CardProjectService {
  return {
    listCardProjects(): CardProject[] {
      return repository.list();
    },

    getCardProject(id: string): CardProject | null {
      return repository.getById(id);
    },

    createCardProject(name: unknown): CardProject {
      return repository.create(normalizeCardProjectName(name));
    },

    updateCardProject(id: string, name: unknown): CardProject | null {
      const normalizedName = normalizeCardProjectName(name);

      return repository.updateName(id, normalizedName);
    },

    deleteCardProject(id: string): boolean {
      return repository.delete(id);
    },
  };
}
