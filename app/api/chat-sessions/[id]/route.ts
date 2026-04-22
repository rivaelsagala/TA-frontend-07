import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5000';

/**
 * DELETE: Delete a specific chat session
 * URL params: id (session_id)
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id is required', status: 'error' },
        { status: 400 }
      );
    }

    const backendResponse = await fetch(`${BACKEND_URL}/api/chat-sessions/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      return NextResponse.json(
        { error: `Failed to delete session: ${errorText}`, status: 'error' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete chat session', status: 'error' },
      { status: 500 }
    );
  }
}
