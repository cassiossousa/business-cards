import { randomUUID } from "node:crypto";

import type Database from "better-sqlite3";

import {
  createEmptyCardProjectFields,
  type CardProjectFields,
  type CardTemplateId,
} from "./cardProjectTypes.js";
import {
  mapCardProjectRow,
  type CardProjectRow,
} from "./cardProjectRowMapper.js";

export interface CardProject {
  id: string;
  name: string;
  createdAt: string;
  templateId: CardTemplateId;
  fields: CardProjectFields;
}

export interface CardProjectRepository {
  list(): CardProject[];
  getById(id: string): CardProject | null;
  create(
    name: string,
    templateId: CardTemplateId,
    fields: CardProjectFields,
  ): CardProject;
  update(
    id: string,
    name: string,
    fields: CardProjectFields,
  ): CardProject | null;
  delete(id: string): boolean;
}

const PROJECT_COLUMNS = `
  p.id,
  p.name,
  p.created_at AS createdAt,
  d.template_id AS templateId,
  d.fields_json AS fieldsJson
`;

export function createCardProjectRepository(
  database: Database.Database,
): CardProjectRepository {
  database.exec(`
    CREATE TABLE IF NOT EXISTS card_project_documents (
      project_id TEXT PRIMARY KEY NOT NULL,
      template_id TEXT NOT NULL
        CHECK (template_id IN ('simple', 'qr-code')),
      fields_json TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  const listStatement = database.prepare(`
    SELECT ${PROJECT_COLUMNS}
    FROM projects p
    LEFT JOIN card_project_documents d ON d.project_id = p.id
    ORDER BY p.created_at DESC, p.id DESC
  `);

  const getByIdStatement = database.prepare(`
    SELECT ${PROJECT_COLUMNS}
    FROM projects p
    LEFT JOIN card_project_documents d ON d.project_id = p.id
    WHERE p.id = ?
  `);

  const insertProjectStatement = database.prepare(`
    INSERT INTO projects (id, name, created_at)
    VALUES (?, ?, ?)
  `);

  const insertDocumentStatement = database.prepare(`
    INSERT INTO card_project_documents (project_id, template_id, fields_json)
    VALUES (?, ?, ?)
  `);

  const updateNameStatement = database.prepare(`
    UPDATE projects SET name = ? WHERE id = ?
  `);

  const upsertFieldsStatement = database.prepare(`
    INSERT INTO card_project_documents (project_id, template_id, fields_json)
    VALUES (?, ?, ?)
    ON CONFLICT(project_id) DO UPDATE SET fields_json = excluded.fields_json
  `);

  const deleteDocumentStatement = database.prepare(
    "DELETE FROM card_project_documents WHERE project_id = ?",
  );

  const deleteProjectStatement = database.prepare(
    "DELETE FROM projects WHERE id = ?",
  );

  function getById(id: string): CardProject | null {
    const row = getByIdStatement.get(id) as CardProjectRow | undefined;
    return row ? mapCardProjectRow(row) : null;
  }

  const createTransaction = database.transaction(
    (
      id: string,
      name: string,
      createdAt: string,
      templateId: CardTemplateId,
      fields: CardProjectFields,
    ): void => {
      insertProjectStatement.run(id, name, createdAt);
      insertDocumentStatement.run(id, templateId, JSON.stringify(fields));
    },
  );

  const updateTransaction = database.transaction(
    (
      id: string,
      name: string,
      fields: CardProjectFields,
    ): CardProject | null => {
      const existing = getById(id);

      if (!existing) {
        return null;
      }

      updateNameStatement.run(name, id);

      // Updating fields never changes the saved template_id.
      upsertFieldsStatement.run(
        id,
        existing.templateId,
        JSON.stringify(fields),
      );

      return getById(id);
    },
  );

  const deleteTransaction = database.transaction((id: string): boolean => {
    deleteDocumentStatement.run(id);
    return deleteProjectStatement.run(id).changes > 0;
  });

  return {
    list(): CardProject[] {
      return (listStatement.all() as CardProjectRow[]).map(mapCardProjectRow);
    },

    getById,

    create(name, templateId, fields): CardProject {
      const completeFields = {
        ...createEmptyCardProjectFields(templateId),
        ...fields,
      };

      const project: CardProject = {
        id: randomUUID(),
        name,
        createdAt: new Date().toISOString(),
        templateId,
        fields: completeFields,
      };

      createTransaction(
        project.id,
        project.name,
        project.createdAt,
        project.templateId,
        project.fields,
      );

      return project;
    },

    update(id, name, fields): CardProject | null {
      return updateTransaction(id, name, fields);
    },

    delete(id): boolean {
      return deleteTransaction(id);
    },
  };
}
