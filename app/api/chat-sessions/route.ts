import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5000';

/**
 * GET: Fetch all chat sessions for a user
 * Query params: user_id
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required', status: 'error' },
        { status: 400 }
      );
    }

    const backendResponse = await fetch(`${BACKEND_URL}/api/chat-sessions?user_id=${userId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      return NextResponse.json(
        { error: `Failed to fetch sessions: ${errorText}`, status: 'error' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chat sessions', status: 'error' },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new chat session
 * Body: { user_id, session_name }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, session_name } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required', status: 'error' },
        { status: 400 }
      );
    }

    const backendResponse = await fetch(`${BACKEND_URL}/api/chat-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        user_id,
        session_name: session_name || 'New Chat',
      }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      return NextResponse.json(
        { error: `Failed to create session: ${errorText}`, status: 'error' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create chat session', status: 'error' },
      { status: 500 }
    );
  }
}
