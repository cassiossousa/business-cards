import { describe, expect, it } from "vitest";

import type { CardTemplateId } from "../cardTypes";
import { CARD_TEMPLATES, getCardTemplate, isCardTemplateId } from "./index";

describe("card template catalog contract", () => {
  it("registers exactly the supported starter templates", () => {
    expect(CARD_TEMPLATES.map((template) => template.id)).toEqual([
      "simple",
      "qr-code",
    ]);
  });

  it.each(["simple", "qr-code"] as const)(
    "resolves the %s template",
    (templateId) => {
      expect(getCardTemplate(templateId).id).toBe(templateId);
    },
  );

  it.each(["simple", "qr-code"] as const)(
    "recognizes %s as a supported template ID",
    (templateId) => {
      expect(isCardTemplateId(templateId)).toBe(true);
    },
  );

  it.each([undefined, null, 42, {}, "unknown"])(
    "rejects an unsupported template ID: %s",
    (value) => {
      expect(isCardTemplateId(value)).toBe(false);
    },
  );

  it("throws when asked to resolve an unknown template", () => {
    expect(() => getCardTemplate("unknown" as CardTemplateId)).toThrow(
      "Unknown card template",
    );
  });
});
