export interface RagasEvaluation {
  faithfulness?: number | null;

  answer_relevance?: number | null;
  answer_relevancy?: number | null;
  answerRelevance?: number | null;
  answerRelevancy?: number | null;

  context_precision?: number | null;
  contextPrecision?: number | null;

  context_recall?: number | null;
  contextRecall?: number | null;

  noise_sensitivity?: number | null;
  noiseSensitivity?: number | null;

  average_score?: number | null;
  averageScore?: number | null;

  status?: string | null;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  sources?: unknown;
  ragasEvaluation?: RagasEvaluation | null;
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
  const maxLength = 50;
  const cleaned = firstMessage.slice(0, maxLength).trim();

  return cleaned.endsWith('...')
    ? cleaned
    : cleaned.length >= maxLength
      ? cleaned + '...'
      : cleaned;
}

interface CreateMessageOptions {
  sources?: unknown;
  ragasEvaluation?: RagasEvaluation | null;
  isStreaming?: boolean;
}

export function createMessage(
  role: 'user' | 'assistant',
  content: string,
  options?: CreateMessageOptions
): Message {
  return {
    id: Math.random().toString(36).substr(2, 9),
    role,
    content,
    timestamp: new Date(),
    sources: options?.sources,
    ragasEvaluation: options?.ragasEvaluation ?? null,
    isStreaming: options?.isStreaming,
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