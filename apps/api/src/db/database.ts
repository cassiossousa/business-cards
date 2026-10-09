import Database from "better-sqlite3";

interface Migration {
  id: string;
  sql: string;
}

const migrations: Migration[] = [
  {
    id: "001-create-projects",
    sql: `
      CREATE TABLE projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
        created_at TEXT NOT NULL
      );
    `,
  },
];

export function createDatabase(filename: string): Database.Database {
  const database = new Database(filename);

  database.pragma("foreign_keys = ON");

  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const migrationExists = database.prepare(
    "SELECT id FROM schema_migrations WHERE id = ?",
  );

  const recordMigration = database.prepare(
    "INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)",
  );

  for (const migration of migrations) {
    if (migrationExists.get(migration.id)) {
      continue;
    }

    database.transaction(() => {
      database.exec(migration.sql);
      recordMigration.run(migration.id, new Date().toISOString());
    })();
  }

  return database;
}
