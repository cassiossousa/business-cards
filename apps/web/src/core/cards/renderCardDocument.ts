import type {
  CardDocument,
  CardRenderModel,
  CardRenderNode,
  CardTemplateElement,
} from "./cardTypes";
import { getCardTemplate } from "./templates";

function renderElement(
  element: CardTemplateElement,
  document: CardDocument,
): CardRenderNode | null {
  if (element.kind === "shape") {
    return {
      id: element.id,
      kind: "shape",
      shape: element.shape,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      fill: element.fill,
    };
  }

  if (element.kind === "text") {
    const text = document.fields[element.field]?.trim() ?? "";

    if (!text) {
      return null;
    }

    return {
      id: element.id,
      kind: "text",
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      text,
      fontSize: element.fontSize,
      fontFamily: element.fontFamily,
      fontWeight: element.fontWeight,
      color: element.color,
      align: element.align,
    };
  }

  const value = document.fields[element.field]?.trim() ?? "";

  if (!value) {
    return null;
  }

  return {
    id: element.id,
    kind: "qr-code",
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    value,
  };
}

export function renderCardDocument(document: CardDocument): CardRenderModel {
  const template = getCardTemplate(document.templateId);
  const nodes = template.layout
    .map((element) => renderElement(element, document))
    .filter((node): node is CardRenderNode => node !== null);

  return {
    width: 90,
    height: 50,
    unit: "mm",
    background: template.background,
    nodes,
  };
}
