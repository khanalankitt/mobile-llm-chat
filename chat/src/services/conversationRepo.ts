import { db } from "@/db/client";

export type Conversation = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
};

function generateId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function createConversation(
  title: string = "New Chat",
): Promise<Conversation> {
  const now = Date.now();
  const conversation: Conversation = {
    id: generateId(),
    title,
    createdAt: now,
    updatedAt: now,
  };

  await db.runAsync(
    `
        INSERT INTO conversations
        (id, title, createdAt, updatedAt)
        VALUES (?, ?, ?, ?)
        `,
    [
      conversation.id,
      conversation.title,
      conversation.createdAt,
      conversation.updatedAt,
    ],
  );

  return conversation;
}

export async function getConversations(): Promise<Conversation[]> {
  return (await db.getAllAsync(
    `
        SELECT *
        FROM conversations
        ORDER BY updatedAt DESC
        `,
  )) as Conversation[];
}

export async function getConversationById(
  id: string,
): Promise<Conversation | null> {
  const result = await db.getFirstAsync(
    `
        SELECT *
        FROM conversations
        WHERE id = ?
        `,
    [id],
  );
  return (result as Conversation) ?? null;
}

export async function updateConversationTitle(
  id: string,
  title: string,
): Promise<void> {
  await db.runAsync(
    `
        UPDATE conversations
        SET title = ?, updatedAt = ?
        WHERE id = ?
        `,
    [title, Date.now(), id],
  );
}

export async function touchConversation(id: string): Promise<void> {
  await db.runAsync(
    `
        UPDATE conversations
        SET updatedAt = ?
        WHERE id = ?
        `,
    [Date.now(), id],
  );
}

export async function deleteConversation(id: string): Promise<void> {
  // messages cascade-delete automatically via ON DELETE CASCADE
  await db.runAsync(
    `
        DELETE FROM conversations
        WHERE id = ?
        `,
    [id],
  );
}

export async function deleteAllConversations(): Promise<void> {
  await db.runAsync(`DELETE FROM conversations`);
}
