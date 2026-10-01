export type ChatRole = "system" | "user" | "assistant";
export type FeedbackType = "good" | "bad";

export interface ChatAttachment {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  storagePath: string;
  url?: string;
}

export interface ChatMessage {
  id?: string;
  role: ChatRole;
  content: string;
  createdAt?: number;
  attachments?: ChatAttachment[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
  isPersisted?: boolean;
  branchFromChatId?: string | null;
  branchFromMessageId?: string | null;
} 
