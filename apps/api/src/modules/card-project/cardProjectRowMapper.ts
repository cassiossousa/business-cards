import {
  createEmptyCardProjectFields,
  isCardTemplateId,
  type CardProjectFields,
  type CardTemplateId,
} from "./cardProjectTypes.js";
import type { CardProject } from "./cardProjectRepository.js";

export interface CardProjectRow {
  id: string;
  name: string;
  createdAt: string;
  templateId: string | null;
  fieldsJson: string | null;
}

export function mapCardProjectRow(row: CardProjectRow): CardProject {
  const templateId: CardTemplateId = isCardTemplateId(row.templateId)
    ? row.templateId
    : "simple";

  return {
    id: row.id,
    name: row.name,
    createdAt: row.createdAt,
    templateId,
    fields: parseCardProjectFields(row.fieldsJson, templateId),
  };
}

function parseCardProjectFields(
  json: string | null,
  templateId: CardTemplateId,
): CardProjectFields {
  const fields = createEmptyCardProjectFields(templateId);

  if (json === null) {
    return fields;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    return fields;
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return fields;
  }

  for (const [key, value] of Object.entries(parsed)) {
    if (
      Object.prototype.hasOwnProperty.call(fields, key) &&
      typeof value === "string"
    ) {
      fields[key as keyof CardProjectFields] = value;
    }
  }

  return fields;
}
