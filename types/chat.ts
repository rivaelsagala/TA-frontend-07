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

export interface SourceMetadata {
  ayat?: string;
  bab?: string;
  bab_title?: string;
  bagian?: string;
  bagian_title?: string;
  chunk_index?: number;
  document_id?: string;
  perdes_number?: string;
  perdes_title?: string;
  perdes_year?: string;
  regency_name?: string;
  section?: string;
  source?: string;
  source_file?: string;
  title?: string;
  total_pages?: number;
  village_name?: string;
}

export interface ChatSource {
  content: string;
  metadata?: SourceMetadata;
}

export interface ChatRequest {
  session_id: number;
  user_id: number;
  message: string;
  model_id: number;
  evaluate?: boolean;
  ground_truth?: string;
}

export interface RAGResult {
  content: string;
  metadata?: SourceMetadata;
  score?: number | null;
  [key: string]: unknown;
}

export interface RAGResponse {
  status: string;
  results?: RAGResult[];
  error?: string;
  message?: string;
  [key: string]: unknown;
}

export interface BackendChatResponse {
  status: string;
  message?: string;
  answer: string;
  question?: string;

  model_used?: string;
  similarity_score?: number | null;
  sources?: ChatSource[];

  evaluation?: RagasEvaluation | null;

  // Fallback kalau backend mengirim metrik langsung di level utama
  faithfulness?: number | null;
  answer_relevance?: number | null;
  answer_relevancy?: number | null;
  context_precision?: number | null;
  context_recall?: number | null;
  noise_sensitivity?: number | null;
  average_score?: number | null;
}

export interface ChatSessionData {
  id: number;
  user_id?: number;
  session_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatHistoryMetadata {
  sources?: ChatSource[];
  evaluation?: RagasEvaluation | null;
  ragasEvaluation?: RagasEvaluation | null;

  [key: string]: unknown;
}

export interface ChatHistoryData {
  id?: number;
  session_id?: number;

  user_query: string;
  llm_response: string;
  metadata?: ChatHistoryMetadata;

  similarity_score?: number | null;

  // Metrik RAGAS dari backend history
  faithfulness?: number | null;
  answer_relevance?: number | null;
  answer_relevancy?: number | null;
  context_precision?: number | null;
  context_recall?: number | null;
  noise_sensitivity?: number | null;
  average_score?: number | null;

  created_at?: string;
  updated_at?: string;
}