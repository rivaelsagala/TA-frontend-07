export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  sources?: unknown;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

export function generateConversationTitle(firstMessage: string): string {
  // Generate title from first user message
  const maxLength = 50;
  const cleaned = firstMessage.slice(0, maxLength).trim();
  return cleaned.endsWith('...') ? cleaned : cleaned.length >= maxLength ? cleaned + '...' : cleaned;
}

export function createMessage(role: 'user' | 'assistant', content: string): Message {
  return {
    id: Math.random().toString(36).substr(2, 9),
    role,
    content,
    timestamp: new Date(),
  };
}

export function createConversation(model: string = 'llama-3'): Conversation {
  return {
    id: Math.random().toString(36).substr(2, 9),
    title: 'New conversation',
    messages: [],
    model,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
