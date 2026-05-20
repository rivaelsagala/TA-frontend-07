export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  ragContext?: RAGResult[]; // Add RAG context to messages
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
  model: string;
}

export interface AIModel {
  id: string;
  name: string;
  description?: string;
  provider?: string;
}

// RAG Types
export interface RAGMetadata {
  chunk_index: number;
  extraction_method: string;
  ocr_page_count: number;
  page_count: number;
  preview: string;
  source: string;
  source_path: string;
}

export interface RAGResult {
  content: string;
  metadata: RAGMetadata;
}

export interface RAGResponse {
  status: string;
  count: number;
  results: RAGResult[];
}

// Source metadata from backend
export interface SourceMetadata {
  author?: string;
  creationDate?: string;
  creationdate?: string;
  creator?: string;
  file_path: string;
  format?: string;
  keywords?: string;
  modDate?: string;
  moddate?: string;
  page?: number;
  producer?: string;
  source: string;
  source_file: string;
  subject?: string;
  title?: string;
  total_pages?: number;
  trapped?: string;
}

// Source document from RAG
export interface Source {
  content: string;
  metadata: SourceMetadata;
}

// Backend Chat Response Interface
export interface BackendChatResponse {
  answer: string;
  question: string;
  status: 'success' | 'error';
  sources: Source[];
}

// Chat Request Interface
export interface ChatRequest {
  message: string;
  session_id: number;
  user_id: number;
  use_finetuned_model: boolean;
}

// Tipe Data untuk Respons API Sesi Chat
export interface ChatSessionData {
  id: number;
  session_name: string;
  created_at: string;
  updated_at: string;
}

export interface ChatHistoryData {
  id: number;
  user_query: string;
  llm_response: string;
  metadata?: any;
  created_at: string;
}

export const DEFAULT_MODELS: AIModel[] = [
  { id: 'llama-3', name: 'Llama 3', provider: 'Meta' },
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
  { id: 'rag-model', name: 'RAG Model', description: 'Retrieval Augmented Generation' },
  { id: 'raft-model', name: 'RAFT Model', description: 'RAFT Model' },
];
