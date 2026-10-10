import { randomUUID } from "node:crypto";

import type Database from "better-sqlite3";

export interface CardProject {
  id: string;
  name: string;
  createdAt: string;
}

export interface CardProjectRepository {
  list(): CardProject[];
  getById(id: string): CardProject | null;
  create(name: string): CardProject;
  updateName(id: string, name: string): CardProject | null;
  delete(id: string): boolean;
}

interface CardProjectRow {
  id: string;
  name: string;
  createdAt: string;
}

const CARD_PROJECT_COLUMNS = "id, name, created_at AS createdAt";

export function createCardProjectRepository(
  database: Database.Database,
): CardProjectRepository {
  const listStatement = database.prepare(
    `SELECT ${CARD_PROJECT_COLUMNS}
     FROM projects
     ORDER BY created_at DESC, id DESC`,
  );

  const getByIdStatement = database.prepare(
    `SELECT ${CARD_PROJECT_COLUMNS}
     FROM projects
     WHERE id = ?`,
  );

  const insertStatement = database.prepare(
    `INSERT INTO projects (id, name, created_at)
     VALUES (?, ?, ?)`,
  );

  const updateNameStatement = database.prepare(
    `UPDATE projects
     SET name = ?
     WHERE id = ?`,
  );

  const deleteStatement = database.prepare("DELETE FROM projects WHERE id = ?");

  function getById(id: string): CardProject | null {
    const row = getByIdStatement.get(id) as CardProjectRow | undefined;

    return row ?? null;
  }

  return {
    list(): CardProject[] {
      return listStatement.all() as CardProject[];
    },

    getById,

    create(name: string): CardProject {
      const project: CardProject = {
        id: randomUUID(),
        name,
        createdAt: new Date().toISOString(),
      };

      insertStatement.run(project.id, project.name, project.createdAt);

      return project;
    },

    updateName(id: string, name: string): CardProject | null {
      const result = updateNameStatement.run(name, id);

      if (result.changes === 0) {
        return null;
      }

      return getById(id);
    },

    delete(id: string): boolean {
      return deleteStatement.run(id).changes > 0;
    },
  };
}
