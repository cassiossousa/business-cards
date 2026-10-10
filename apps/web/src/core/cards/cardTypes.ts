export type CardTemplateId = "simple" | "qr-code";

export type CardFieldKey =
  "fullName" | "role" | "email" | "phone" | "website" | "qrUrl";

export type CardFieldInputType = "text" | "email" | "tel" | "url";

export interface CardFieldDefinition {
  key: CardFieldKey;
  label: string;
  inputType: CardFieldInputType;
  placeholder: string;
  initialValue: string;
  required?: boolean;
  autocomplete?: string;
}

export type CardFields = Partial<Record<CardFieldKey, string>>;

export interface CardDocument {
  templateId: CardTemplateId;
  fields: CardFields;
}

interface PositionedElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TemplateTextElement extends PositionedElement {
  kind: "text";
  field: CardFieldKey;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  color: string;
  align: "left" | "center" | "right";
}

export interface TemplateShapeElement extends PositionedElement {
  kind: "shape";
  shape: "rectangle";
  fill: string;
}

export interface TemplateQrElement extends PositionedElement {
  kind: "qr-code";
  field: "qrUrl";
}

export type CardTemplateElement =
  TemplateTextElement | TemplateShapeElement | TemplateQrElement;

export interface CardTemplateDefinition {
  id: CardTemplateId;
  name: string;
  description: string;
  background: string;
  fields: readonly CardFieldDefinition[];
  layout: readonly CardTemplateElement[];
}

export interface RenderedTextElement extends PositionedElement {
  kind: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  color: string;
  align: "left" | "center" | "right";
}

export interface RenderedShapeElement extends PositionedElement {
  kind: "shape";
  shape: "rectangle";
  fill: string;
}

export interface RenderedQrElement extends PositionedElement {
  kind: "qr-code";
  value: string;
}

export type CardRenderNode =
  RenderedTextElement | RenderedShapeElement | RenderedQrElement;

export interface CardRenderModel {
  width: 90;
  height: 50;
  unit: "mm";
  background: string;
  nodes: CardRenderNode[];
}
