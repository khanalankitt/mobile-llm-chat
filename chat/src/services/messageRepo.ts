import { db } from "@/db/client";

export type MessageRole = "user" | "assistant";

export type StoredMessage = {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: number;
};

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function addMessage(
  conversationId: string,
  role: MessageRole,
  content: string,
): Promise<StoredMessage> {
  const message: StoredMessage = {
    id: generateId(),
    conversationId,
    role,
    content,
    createdAt: Date.now(),
  };

  await db.runAsync(
    `
        INSERT INTO messages
        (id, conversationId, role, content, createdAt)
        VALUES (?, ?, ?, ?, ?)
        `,
    [
      message.id,
      message.conversationId,
      message.role,
      message.content,
      message.createdAt,
    ],
  );

  return message;
}

export async function getMessagesForConversation(
  conversationId: string,
): Promise<StoredMessage[]> {
  return (await db.getAllAsync(
    `
        SELECT *
        FROM messages
        WHERE conversationId = ?
        ORDER BY createdAt ASC
        `,
    [conversationId],
  )) as StoredMessage[];
}

export async function updateMessageContent(
  id: string,
  content: string,
): Promise<void> {
  await db.runAsync(
    `
        UPDATE messages
        SET content = ?
        WHERE id = ?
        `,
    [content, id],
  );
}

export async function deleteMessage(id: string): Promise<void> {
  await db.runAsync(
    `
        DELETE FROM messages
        WHERE id = ?
        `,
    [id],
  );
}

export async function deleteMessagesForConversation(
  conversationId: string,
): Promise<void> {
  await db.runAsync(
    `
        DELETE FROM messages
        WHERE conversationId = ?
        `,
    [conversationId],
  );
}
