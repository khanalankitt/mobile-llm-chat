import { db } from "./client";
import {
  CREATE_CONVERSATIONS_TABLE,
  CREATE_MESSAGES_TABLE,
  CREATE_MODELS_TABLE,
} from "./schema";

export function initializeDatabase() {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    ${CREATE_CONVERSATIONS_TABLE}

    ${CREATE_MESSAGES_TABLE}

    ${CREATE_MODELS_TABLE}

  `);

  console.log("Database initialized.");
}
