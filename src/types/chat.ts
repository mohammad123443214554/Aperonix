export type ChatRole = "system" | "user" | "assistant";
export type FeedbackType = "good" | "bad";

export interface ChatMessage {
  id?: string;
  role: ChatRole;
  content: string;
  createdAt?: number;
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
