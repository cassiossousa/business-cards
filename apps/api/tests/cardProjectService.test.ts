import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDatabase } from "../src/db/database.js";
import { createCardProjectRepository } from "../src/modules/card-project/cardProjectRepository.js";
import {
  createCardProjectService,
  InvalidCardProjectFieldsError,
  InvalidCardProjectNameError,
  InvalidCardTemplateError,
} from "../src/modules/card-project/cardProjectService.js";

let database: ReturnType<typeof createDatabase>;
let service: ReturnType<typeof createCardProjectService>;

beforeEach(() => {
  database = createDatabase(":memory:");
  service = createCardProjectService(createCardProjectRepository(database));
});

afterEach(() => {
  database.close();
});

describe("card project service", () => {
  it("trims the project name and preserves submitted fields", () => {
    const created = service.createCardProject("  Portfolio  ", "simple", {
      fullName: "Alex Morgan",
    });

    expect(created.name).toBe("Portfolio");
    expect(created.templateId).toBe("simple");
    expect(created.fields.fullName).toBe("Alex Morgan");
  });

  it("creates a QR Code project with QR destination data", () => {
    const created = service.createCardProject("QR portfolio", "qr-code", {
      qrUrl: "https://example.com",
    });

    expect(created.templateId).toBe("qr-code");
    expect(created.fields.qrUrl).toBe("https://example.com");
  });

  it("rejects unsupported template IDs", () => {
    expect(() => service.createCardProject("Portfolio", "premium", {})).toThrow(
      InvalidCardTemplateError,
    );
  });

  it("rejects blank and overlong project names", () => {
    expect(() => service.createCardProject(" ", "simple", {})).toThrow(
      InvalidCardProjectNameError,
    );

    expect(() =>
      service.createCardProject("x".repeat(81), "simple", {}),
    ).toThrow(InvalidCardProjectNameError);
  });

  it("rejects QR-only fields on a Simple project", () => {
    expect(() =>
      service.createCardProject("Portfolio", "simple", {
        qrUrl: "https://example.com",
      }),
    ).toThrow(InvalidCardProjectFieldsError);
  });

  it("rejects non-string and overlong card fields", () => {
    expect(() =>
      service.createCardProject("Portfolio", "simple", {
        fullName: 42,
      }),
    ).toThrow(InvalidCardProjectFieldsError);

    expect(() =>
      service.createCardProject("Portfolio", "simple", {
        fullName: "x".repeat(201),
      }),
    ).toThrow(InvalidCardProjectFieldsError);
  });

  it("updates fields while keeping the original template", () => {
    const created = service.createCardProject("QR portfolio", "qr-code", {
      fullName: "Alex Morgan",
      qrUrl: "https://example.com",
    });

    const updated = service.updateCardProject(created.id, "Updated portfolio", {
      fullName: "Jordan Lee",
      qrUrl: "https://portfolio.example",
    });

    expect(updated).toMatchObject({
      name: "Updated portfolio",
      templateId: "qr-code",
      fields: {
        fullName: "Jordan Lee",
        qrUrl: "https://portfolio.example",
      },
    });
  });

  it("returns null when updating a missing project", () => {
    expect(service.updateCardProject("missing", "Portfolio", {})).toBeNull();
  });

  it("rejects an empty QR destination", () => {
    expect(() =>
      service.createCardProject("QR portfolio", "qr-code", {
        fullName: "Alex Morgan",
        qrUrl: "",
      }),
    ).toThrow("Enter a QR code destination.");
  });

  it("rejects non-HTTP QR destinations", () => {
    expect(() =>
      service.createCardProject("QR portfolio", "qr-code", {
        fullName: "Alex Morgan",
        qrUrl: "javascript:alert(1)",
      }),
    ).toThrow("valid HTTP or HTTPS QR code destination");
  });
});
