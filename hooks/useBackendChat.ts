import { useState } from 'react';
import type { BackendChatResponse, ChatRequest } from '@/types/chat';
import { formatBackendError } from '@/lib/backend-utils';

export interface ChatHookResult {
  sendMessage: (message: string, sessionId: number, userId: number) => Promise<BackendChatResponse | null>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useBackendChat = (): ChatHookResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const sendMessage = async (
    message: string,
    sessionId: number,
    userId: number
  ): Promise<BackendChatResponse | null> => {
    if (!message.trim()) {
      setError('Message cannot be empty');
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const requestBody: ChatRequest = {
        session_id: sessionId,
        user_id: userId,
        message: message.trim(),
        use_finetuned_model: false,
      };

      console.log('Sending chat request to Next.js API:', requestBody);

      // PERUBAHAN: Tembak ke Next.js API Route, BUKAN ke Flask langsung
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: `HTTP ${response.status}: ${response.statusText}` 
        }));
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data: BackendChatResponse = await response.json();
      
      if (data.status !== 'success') {
        throw new Error(data.answer || 'Chat request failed');
      }

      return data;
    } catch (err) {
      const rawError = err instanceof Error ? err.message : 'Failed to send message';
      const formattedError = formatBackendError(rawError);
      setError(formattedError);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    sendMessage, 
    isLoading, 
    error, 
    clearError 
  };
};

// import { useState } from 'react';
// import type { BackendChatResponse, ChatRequest } from '@/types/chat';
// import { formatBackendError } from '@/lib/backend-utils';

// // Sesuaikan URL Backend Flask kamu di sini
// const FLASK_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// export interface ChatHookResult {
//   sendMessage: (message: string, sessionId: number, userId: number) => Promise<BackendChatResponse | null>;
//   isLoading: boolean;
//   error: string | null;
//   clearError: () => void;
// }

// export const useBackendChat = (): ChatHookResult => {
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const clearError = () => setError(null);

//   const sendMessage = async (
//     message: string,
//     sessionId: number,
//     userId: number
//   ): Promise<BackendChatResponse | null> => {
//     if (!message.trim()) {
//       setError('Message cannot be empty');
//       return null;
//     }
    
//     try {
//       setIsLoading(true);
//       setError(null);
      
//       const requestBody: ChatRequest = {
//         message: message.trim(),
//         session_id: sessionId,
//         user_id: userId
//       };

//       console.log('Sending chat request:', requestBody);

//       // Tembak langsung ke API Flask
//       const response = await fetch(`${FLASK_BASE_URL}/api/chat`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(requestBody),
//       });

//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({ 
//           error: `HTTP ${response.status}: ${response.statusText}` 
//         }));
//         throw new Error(errorData.error || 'Failed to send message');
//       }

//       const data: BackendChatResponse = await response.json();
      
//       if (data.status !== 'success') {
//         throw new Error(data.answer || 'Chat request failed');
//       }

//       return data;
//     } catch (err) {
//       const rawError = err instanceof Error ? err.message : 'Failed to send message';
//       const formattedError = formatBackendError(rawError);
//       setError(formattedError);
//       return null;
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return { 
//     sendMessage, 
//     isLoading, 
//     error, 
//     clearError 
//   };
// };

// import { useState } from 'react';
// import type { BackendChatResponse, ChatRequest } from '@/types/chat';
// import { formatBackendError } from '@/lib/backend-utils';

// export interface ChatHookResult {
//   sendMessage: (message: string) => Promise<BackendChatResponse | null>;
//   isLoading: boolean;
//   error: string | null;
//   clearError: () => void;
// }

// export const useBackendChat = (): ChatHookResult => {
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const clearError = () => setError(null);

//   const sendMessage = async (
//     message: string
//   ): Promise<BackendChatResponse | null> => {
//     if (!message.trim()) {
//       setError('Message cannot be empty');
//       return null;
//     }
    
//     try {
//       setIsLoading(true);
//       setError(null);
      
//       const requestBody: ChatRequest = {
//         message: message.trim(),
//       };

//       console.log('Sending chat request:', requestBody);

//       const response = await fetch('/api/chat', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(requestBody),
//       });

//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({ 
//           error: `HTTP ${response.status}: ${response.statusText}` 
//         }));
//         throw new Error(errorData.error || 'Failed to send message');
//       }

//       const data: BackendChatResponse = await response.json();
//       console.log('Received chat response:', data);
      
//       if (data.status !== 'success') {
//         throw new Error(data.answer || 'Chat request failed');
//       }

//       return data;
//     } catch (err) {
//       const rawError = err instanceof Error ? err.message : 'Failed to send message';
//       const formattedError = formatBackendError(rawError);
//       console.error('Chat error:', err);
//       setError(formattedError);
//       return null;
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return { 
//     sendMessage, 
//     isLoading, 
//     error, 
//     clearError 
//   };
// };