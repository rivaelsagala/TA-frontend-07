import { NextResponse } from 'next/server';
import type { BackendChatResponse, ChatRequest } from '@/types/chat';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:5000';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      message,
      question,
      session_id,
      user_id,
      model_id,
      evaluate,
      ground_truth,
    } = body;

    const chatMessage = message || question;

    if (!chatMessage || typeof chatMessage !== 'string') {
      return NextResponse.json(
        {
          error: 'Message is required and must be a string',
          status: 'error',
        },
        { status: 400 }
      );
    }

    const chatRequest: ChatRequest = {
      session_id,
      user_id,
      message: chatMessage.trim(),
      model_id: model_id ?? 1,

      // Untuk evaluasi RAGAS
      evaluate: evaluate ?? false,
      ground_truth: ground_truth,
    };

    console.log('Proxying request to Flask Backend:', `${BACKEND_URL}/api/chat`);
    console.log('Payload to Flask:', chatRequest);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    try {
      const backendResponse = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(chatRequest),
        signal: controller.signal,
        cache: 'no-store',
      });

      clearTimeout(timeout);

      if (!backendResponse.ok) {
        const errorText = await backendResponse.text();

        let errorData: { error?: string; message?: string };

        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = {
            error: `Backend service failed with status ${backendResponse.status}`,
          };
        }

        return NextResponse.json(
          {
            error:
              errorData.error ||
              errorData.message ||
              'Backend service failed',
            status: 'error',
          },
          { status: backendResponse.status }
        );
      }

      const data: BackendChatResponse = await backendResponse.json();

      console.log('Response from Flask:', data);

      return NextResponse.json({
        answer: data.answer,
        status: data.status,
        message: data.message,
        model_used: data.model_used,
        similarity_score: data.similarity_score,
        sources: data.sources || [],

        // Ini yang penting agar frontend menerima hasil RAGAS
        evaluation: data.evaluation ?? null,
      });
    } catch (fetchError: unknown) {
      clearTimeout(timeout);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          {
            error: 'Request timed out.',
            status: 'error',
          },
          { status: 408 }
        );
      }

      console.error('Failed to connect to Flask backend:', fetchError);

      return NextResponse.json(
        {
          error: 'Failed to connect to backend service.',
          status: 'error',
        },
        { status: 503 }
      );
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to process chat query';

    console.error('Chat API error:', error);

    return NextResponse.json(
      {
        error: message,
        status: 'error',
      },
      { status: 500 }
    );
  }
}