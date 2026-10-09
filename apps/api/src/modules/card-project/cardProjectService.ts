import type {
  CardProject,
  CardProjectRepository,
} from "./cardCardProjectRepository.js";

export class InvalidCardProjectNameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCardProjectNameError";
  }
}

export class CardProjectService {
  constructor(private readonly repository: CardProjectRepository) {}

  listCardProjects(): CardProject[] {
    return this.repository.list();
  }

  createCardProject(rawName: string): CardProject {
    const name = rawName.trim();

    if (!name) {
      throw new InvalidCardProjectNameError("Enter a project name.");
    }

    if (name.length > 80) {
      throw new InvalidCardProjectNameError(
        "CardProject names must be 80 characters or fewer.",
      );
    }

    return this.repository.create(name);
  }

  deleteCardProject(id: string): boolean {
    return this.repository.delete(id);
  }
}
