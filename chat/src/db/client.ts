import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("native-local-ai.db");