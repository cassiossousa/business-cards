export const CARD_TEMPLATE_IDS = ["simple", "qr-code"] as const;

export type CardTemplateId = (typeof CARD_TEMPLATE_IDS)[number];

export type CardFieldKey =
  "fullName" | "role" | "email" | "phone" | "website" | "qrUrl";

export type CardProjectFields = Partial<Record<CardFieldKey, string>>;

export const CARD_TEMPLATE_FIELD_KEYS: Record<
  CardTemplateId,
  readonly CardFieldKey[]
> = {
  simple: ["fullName", "role", "email", "phone", "website"],
  "qr-code": ["fullName", "role", "email", "phone", "website", "qrUrl"],
};

export function isCardTemplateId(value: unknown): value is CardTemplateId {
  return value === "simple" || value === "qr-code";
}

export function createEmptyCardProjectFields(
  templateId: CardTemplateId,
): CardProjectFields {
  const fields: CardProjectFields = {};

  for (const key of CARD_TEMPLATE_FIELD_KEYS[templateId]) {
    fields[key] = "";
  }

  return fields;
}
