export type ChatRole = "system" | "user" | "assistant";
export type FeedbackType = "good" | "bad";

export interface ChatAttachment {
  id: string;
  chatId?: string;
  messageId?: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath?: string;
  createdAt?: number;
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
  branchFromChatId?: string | null;
  branchFromMessageId?: string | null;
} 
