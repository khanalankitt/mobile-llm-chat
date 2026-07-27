import {
  CREATE_CONVERSATIONS_TABLE,
  CREATE_MESSAGES_TABLE,
  CREATE_MODELS_TABLE,
} from "./schema";

export function runMigrations(db: any) {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    ${CREATE_CONVERSATIONS_TABLE}

    ${CREATE_MESSAGES_TABLE}

    ${CREATE_MODELS_TABLE}

  `);

  console.log("Database initialized.");
}
