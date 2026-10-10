import { getCardTemplate } from "./templates";
import { updateCardFields } from "./updateCardFields";
import type { CardDocument, CardFields, CardTemplateId } from "./cardTypes";

export function createCardDocument(
  templateId: CardTemplateId = "simple",
  initialFields: CardFields = {},
): CardDocument {
  const template = getCardTemplate(templateId);
  const fields: CardFields = {};

  for (const definition of template.fields) {
    fields[definition.key] = definition.initialValue;
  }

  return updateCardFields(
    {
      templateId,
      fields,
    },
    initialFields,
  );
}
