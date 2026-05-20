/**
 * Utility functions for backend integration
 */

export interface BackendHealthResponse {
  status: 'healthy' | 'error';
  message?: string;
  timestamp?: string;
}

/**
 * Check if the backend service is available
 */
export const checkBackendHealth = async (): Promise<BackendHealthResponse> => {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      return {
        status: 'healthy',
        message: 'Backend service is running',
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        status: 'error',
        message: `Backend returned status ${response.status}`,
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string };
    if (err.name === 'AbortError') {
      return {
        status: 'error',
        message: 'Backend service timeout',
        timestamp: new Date().toISOString(),
      };
    }
    
    return {
      status: 'error',
      message: 'Cannot connect to backend service',
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Generate a unique session ID
 */
export const generateSessionId = (): string => {
  return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Format backend error messages for display
 */
export const formatBackendError = (error: string): string => {
  // Common error message improvements
  const errorMappings: Record<string, string> = {
    'Failed to connect to backend service': 'Cannot connect to server. Please ensure the backend is running on port 5000.',
    'Backend service failed': 'Server error. Please try again or contact support if the problem persists.',
    'Request timed out': 'The request took too long. Please check your connection and try again.',
    'Invalid response from backend service': 'Received invalid response from server. Please try again.',
  };

  return errorMappings[error] || error;
};