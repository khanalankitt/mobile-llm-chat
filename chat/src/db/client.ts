import * as SQLite from "expo-sqlite";
import { runMigrations } from "./migrations";

export const db = SQLite.openDatabaseSync("local-ai.db");

export async function initializeDatabase() {
  runMigrations(db);
}
