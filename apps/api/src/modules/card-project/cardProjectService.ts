import {
  CARD_TEMPLATE_FIELD_KEYS,
  createEmptyCardProjectFields,
  isCardTemplateId,
  type CardProjectFields,
  type CardTemplateId,
} from "./cardProjectTypes.js";
import type {
  CardProject,
  CardProjectRepository,
} from "./cardProjectRepository.js";

export const MAX_CARD_PROJECT_NAME_LENGTH = 80;
export const MAX_CARD_FIELD_LENGTH = 200;

export class InvalidCardProjectNameError extends Error {
  readonly code = "INVALID_NAME";

  constructor(message: string) {
    super(message);
    this.name = "InvalidCardProjectNameError";
  }
}

export class InvalidCardTemplateError extends Error {
  readonly code = "INVALID_TEMPLATE";

  constructor(message = "Choose a supported card template.") {
    super(message);
    this.name = "InvalidCardTemplateError";
  }
}

export class InvalidCardProjectFieldsError extends Error {
  readonly code = "INVALID_CARD_FIELDS";

  constructor(message: string) {
    super(message);
    this.name = "InvalidCardProjectFieldsError";
  }
}

function normalizeProjectName(value: unknown): string {
  if (typeof value !== "string") {
    throw new InvalidCardProjectNameError("Enter a project name.");
  }

  const name = value.trim();

  if (!name) {
    throw new InvalidCardProjectNameError("Enter a project name.");
  }

  if (name.length > MAX_CARD_PROJECT_NAME_LENGTH) {
    throw new InvalidCardProjectNameError(
      "CardProject names must be 80 characters or fewer.",
    );
  }

  return name;
}

function normalizeTemplateId(value: unknown): CardTemplateId {
  if (value === undefined || value === null) {
    return "simple";
  }

  if (!isCardTemplateId(value)) {
    throw new InvalidCardTemplateError();
  }

  return value;
}

function validateQrUrl(value: string | undefined): string {
  const qrUrl = value?.trim();

  if (!qrUrl) {
    throw new InvalidCardProjectFieldsError("Enter a QR code destination.");
  }

  try {
    const url = new URL(qrUrl);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("Unsupported URL protocol.");
    }
  } catch {
    throw new InvalidCardProjectFieldsError(
      "Enter a valid HTTP or HTTPS QR code destination.",
    );
  }

  return qrUrl;
}

function normalizeFields(
  templateId: CardTemplateId,
  value: unknown,
): CardProjectFields {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new InvalidCardProjectFieldsError("Card fields must be an object.");
  }

  const input = value as Record<string, unknown>;
  const allowedKeys = CARD_TEMPLATE_FIELD_KEYS[templateId];
  const fields = createEmptyCardProjectFields(templateId);

  for (const [key, fieldValue] of Object.entries(input)) {
    if (!allowedKeys.includes(key as (typeof allowedKeys)[number])) {
      throw new InvalidCardProjectFieldsError(
        `The "${key}" field is not available in the ${templateId} template.`,
      );
    }

    if (typeof fieldValue !== "string") {
      throw new InvalidCardProjectFieldsError(
        `The "${key}" field must be text.`,
      );
    }

    if (fieldValue.length > MAX_CARD_FIELD_LENGTH) {
      throw new InvalidCardProjectFieldsError(
        `Card fields must be ${MAX_CARD_FIELD_LENGTH} characters or fewer.`,
      );
    }

    fields[key as keyof CardProjectFields] = fieldValue;
  }

  if (templateId === "qr-code") {
    fields.qrUrl = validateQrUrl(fields.qrUrl);
  }

  return fields;
}

export interface CardProjectService {
  listCardProjects(): CardProject[];
  getCardProject(id: string): CardProject | null;
  createCardProject(
    name: unknown,
    templateId?: unknown,
    fields?: unknown,
  ): CardProject;
  updateCardProject(
    id: string,
    name: unknown,
    fields?: unknown,
  ): CardProject | null;
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

    createCardProject(name, templateIdValue, fieldsValue): CardProject {
      const normalizedName = normalizeProjectName(name);
      const templateId = normalizeTemplateId(templateIdValue);
      const fields = normalizeFields(templateId, fieldsValue ?? {});

      return repository.create(normalizedName, templateId, fields);
    },

    updateCardProject(id, name, fieldsValue): CardProject | null {
      const existing = repository.getById(id);

      if (!existing) {
        return null;
      }

      const normalizedName = normalizeProjectName(name);
      const fields = normalizeFields(
        existing.templateId,
        fieldsValue ?? existing.fields,
      );

      // Template selection is intentionally not an update parameter.
      return repository.update(id, normalizedName, fields);
    },

    deleteCardProject(id): boolean {
      return repository.delete(id);
    },
  };
}
