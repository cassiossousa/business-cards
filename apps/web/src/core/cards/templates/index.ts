import { simpleTemplate } from "./simple";
import { qrCodeTemplate } from "./qrCode";
import type { CardTemplateDefinition, CardTemplateId } from "../cardTypes";

export const CARD_TEMPLATES: readonly CardTemplateDefinition[] = [
  simpleTemplate,
  qrCodeTemplate,
];

export function isCardTemplateId(value: unknown): value is CardTemplateId {
  return value === "simple" || value === "qr-code";
}

export function getCardTemplate(
  templateId: CardTemplateId,
): CardTemplateDefinition {
  const template = CARD_TEMPLATES.find((item) => item.id === templateId);

  if (!template) {
    throw new Error(`Unknown card template: ${String(templateId)}`);
  }

  return template;
}
