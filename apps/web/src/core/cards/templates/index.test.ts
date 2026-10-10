import { describe, expect, it } from "vitest";

import { CARD_TEMPLATES, getCardTemplate } from ".";
import { createCardDocument } from "../createCardDocument";
import { renderCardDocument } from "../renderCardDocument";
import {
  updateCardFields,
  UnsupportedCardFieldError,
} from "../updateCardFields";

describe("card templates", () => {
  it("exposes Simple and QR Code templates", () => {
    expect(CARD_TEMPLATES.map((template) => template.id)).toEqual([
      "simple",
      "qr-code",
    ]);
  });

  it("declares editable fields for the Simple template", () => {
    expect(getCardTemplate("simple").fields.map((field) => field.key)).toEqual([
      "fullName",
      "role",
      "email",
      "phone",
      "website",
    ]);
  });

  it("declares the QR destination only for the QR Code template", () => {
    expect(
      getCardTemplate("qr-code").fields.map((field) => field.key),
    ).toContain("qrUrl");

    expect(
      getCardTemplate("simple").fields.some((field) => field.key === "qrUrl"),
    ).toBe(false);
  });
});

describe("createCardDocument", () => {
  it("creates a Simple document with editable starter content", () => {
    const document = createCardDocument("simple");

    expect(document.templateId).toBe("simple");
    expect(document.fields.fullName).toBe("Alex Morgan");
    expect(document.fields.email).toBe("alex@example.com");
    expect(document.fields.qrUrl).toBeUndefined();
  });

  it("creates a QR Code document with a destination URL", () => {
    const document = createCardDocument("qr-code");

    expect(document.templateId).toBe("qr-code");
    expect(document.fields.qrUrl).toBe("https://example.com");
  });

  it("returns separate field objects for separate documents", () => {
    const first = createCardDocument("simple");
    const second = createCardDocument("simple");

    expect(first).not.toBe(second);
    expect(first.fields).not.toBe(second.fields);
  });
});

describe("updateCardFields", () => {
  it("updates fields without mutating the original document", () => {
    const original = createCardDocument("simple");
    const updated = updateCardFields(original, {
      fullName: "Jordan Lee",
      email: "jordan@example.com",
    });

    expect(updated.templateId).toBe("simple");
    expect(updated.fields.fullName).toBe("Jordan Lee");
    expect(updated.fields.email).toBe("jordan@example.com");
    expect(original.fields.fullName).toBe("Alex Morgan");
    expect(original.fields.email).toBe("alex@example.com");
  });

  it("does not let Simple documents acquire a QR field", () => {
    const document = createCardDocument("simple");

    expect(() =>
      updateCardFields(document, { qrUrl: "https://example.com" }),
    ).toThrow(UnsupportedCardFieldError);
  });

  it("preserves the chosen template when updating fields", () => {
    const original = createCardDocument("qr-code");
    const updated = updateCardFields(original, {
      fullName: "Jordan Lee",
    });

    expect(updated.templateId).toBe("qr-code");
  });
});

describe("renderCardDocument", () => {
  it("renders a 90 by 50 mm Simple card without depending on a UI framework", () => {
    const model = renderCardDocument(createCardDocument("simple"));

    expect(model).toMatchObject({
      width: 90,
      height: 50,
      unit: "mm",
      background: "#fbfaf7",
    });
    expect(model.nodes.some((node) => node.kind === "text")).toBe(true);
    expect(model.nodes.some((node) => node.kind === "qr-code")).toBe(false);
  });

  it("emits a QR render node containing the selected destination", () => {
    const document = createCardDocument("qr-code", {
      qrUrl: "https://portfolio.example",
    });
    const model = renderCardDocument(document);
    const qrNode = model.nodes.find((node) => node.kind === "qr-code");

    expect(qrNode).toMatchObject({
      kind: "qr-code",
      value: "https://portfolio.example",
    });
  });

  it("omits text and QR nodes whose content is blank", () => {
    const document = createCardDocument("qr-code", {
      fullName: "",
      qrUrl: "",
    });
    const model = renderCardDocument(document);

    expect(
      model.nodes.some(
        (node) => node.kind === "text" && node.id === "fullName",
      ),
    ).toBe(false);
    expect(model.nodes.some((node) => node.kind === "qr-code")).toBe(false);
  });
});
