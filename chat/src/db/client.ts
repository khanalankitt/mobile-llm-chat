import * as SQLite from "expo-sqlite";
import { runMigrations } from "./migrations";

export const db = SQLite.openDatabaseSync("local-ai.db");

export async function initializeDatabase() {
  runMigrations(db);
}

export async function deleteAllModelMetadata() {
  await db.runAsync(`DELETE FROM models`);
}

export async function clearAllHistory() {
  await db.runAsync(`DELETE FROM messages`);
  await db.runAsync(`DELETE FROM chats`);
}
