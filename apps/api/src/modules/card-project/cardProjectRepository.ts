import { randomUUID } from "node:crypto";

import type Database from "better-sqlite3";

export interface CardProject {
  id: string;
  name: string;
  createdAt: string;
}

export interface ProjectRepository {
  list(): CardProject[];
  create(name: string): CardProject;
  delete(id: string): boolean;
}

interface ProjectRow {
  id: string;
  name: string;
  created_at: string;
}

function toProject(row: ProjectRow): CardProject {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  };
}

export class SqliteProjectRepository implements ProjectRepository {
  constructor(private readonly database: Database.Database) {}

  list(): CardProject[] {
    const rows = this.database
      .prepare(
        `SELECT id, name, created_at
         FROM projects
         ORDER BY created_at DESC, id ASC`,
      )
      .all() as ProjectRow[];

    return rows.map(toProject);
  }

  create(name: string): CardProject {
    const cardProject: CardProject = {
      id: randomUUID(),
      name,
      createdAt: new Date().toISOString(),
    };

    this.database
      .prepare(
        `INSERT INTO projects (id, name, created_at)
         VALUES (?, ?, ?)`,
      )
      .run(cardProject.id, cardProject.name, cardProject.createdAt);

    return cardProject;
  }

  delete(id: string): boolean {
    const result = this.database
      .prepare("DELETE FROM projects WHERE id = ?")
      .run(id);

    return result.changes > 0;
  }
}
