export const CREATE_CONVERSATIONS_TABLE = `
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
);
`;

export const CREATE_MESSAGES_TABLE = `
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY NOT NULL,
    conversationId TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    FOREIGN KEY (conversationId)
        REFERENCES conversations(id)
        ON DELETE CASCADE
);
`;

export const CREATE_MODELS_TABLE = `
CREATE TABLE IF NOT EXISTS models (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    filename TEXT NOT NULL UNIQUE,
    path TEXT NOT NULL,
    size TEXT NOT NULL,
    ramRequiredBytes INTEGER NOT NULL,
    ramLabel TEXT NOT NULL,
    downloaded INTEGER DEFAULT 0,
    selected INTEGER DEFAULT 0,
    createdAt INTEGER NOT NULL
);
`;
