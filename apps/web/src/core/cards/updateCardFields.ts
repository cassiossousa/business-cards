import { getCardTemplate } from "./templates";
import type { CardDocument, CardFieldKey, CardFields } from "./cardTypes";

export class UnsupportedCardFieldError extends Error {
  constructor(field: string, templateId: string) {
    super(`Field "${field}" is not supported by the "${templateId}" template.`);
    this.name = "UnsupportedCardFieldError";
  }
}

export function updateCardFields(
  document: CardDocument,
  changes: CardFields,
): CardDocument {
  const allowedFields = new Set(
    getCardTemplate(document.templateId).fields.map((field) => field.key),
  );

  for (const [field, value] of Object.entries(changes)) {
    if (!allowedFields.has(field as CardFieldKey)) {
      throw new UnsupportedCardFieldError(field, document.templateId);
    }

    if (typeof value !== "string") {
      throw new TypeError(`Card field "${field}" must be a string.`);
    }
  }

  return {
    templateId: document.templateId,
    fields: {
      ...document.fields,
      ...changes,
    },
  };
}
