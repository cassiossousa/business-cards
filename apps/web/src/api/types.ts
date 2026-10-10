import type { CardFields, CardTemplateId } from "../core/cards/cardTypes";

export type CardProjectTemplateId = CardTemplateId;
export type CardProjectFields = CardFields;

export interface CardProject {
  id: string;
  name: string;
  createdAt: string;

  // Optional for compatibility with older stored projects and test fixtures.
  // New API responses include both properties.
  templateId?: CardProjectTemplateId;
  fields?: CardProjectFields;
}

export interface CardProjectListResponse {
  projects: CardProject[];
}

export interface CreateCardProjectInput {
  name: string;
  templateId: CardProjectTemplateId;
  fields: CardProjectFields;
}

export interface UpdateCardProjectInput {
  name: string;
  fields: CardProjectFields;
}
