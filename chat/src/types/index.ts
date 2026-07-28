export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}
export type MessageRole = "user" | "assistant" | "system";

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: number;
}

export type ModelTier = "low" | "medium" | "high";

export interface LocalModel {
  id: string;
  name: string;
  description: string;
  tier: ModelTier;
  size: string | number;
  ramRequired: string | number;
  filename: string;
  url: string;
  downloaded: boolean;
}
