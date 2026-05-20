import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // Timeout 120 detik (2 menit)

    const backendResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/rag-query`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ query }),
        signal: controller.signal
      }
    ).finally(() => clearTimeout(timeout));

    // Handle response
    if (!backendResponse.ok) {
      const error = await backendResponse.json().catch(() => ({}));
      console.error('Backend error:', error);
      throw new Error(error.error || 'Backend RAG service failed');
    }

    return NextResponse.json(await backendResponse.json());
    
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process RAG query';
    const stack = error instanceof Error ? error.stack : undefined;
    console.error('RAG proxy error:', error);
    return NextResponse.json(
      { 
        error: message,
        details: process.env.NODE_ENV === 'development' ? stack : undefined,
        status: "error"
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';