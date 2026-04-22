import { useState } from 'react';
import type { RAGResponse, RAGResult } from '@/types/chat';

export const useRAG = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContext = async (query: string): Promise<RAGResult[] | null> => {
    if (!query.trim()) return null;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get context');
      }

      const data: RAGResponse = await response.json();
      
      if (data.status !== 'success') {
        throw new Error('RAG query failed');
      }

      return data.results || [];
    } catch (err) {
      console.error('RAG error:', err);
      setError(err instanceof Error ? err.message : 'Failed to retrieve relevant information');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { getContext, isLoading, error };
};