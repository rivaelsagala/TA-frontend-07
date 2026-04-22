import { NextResponse } from 'next/server';
import type { BackendChatResponse, ChatRequest } from '@/types/chat';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, question, session_id, user_id } = body;
    const chatMessage = message || question; 
    
    if (!chatMessage || typeof chatMessage !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Backend Flask URL (Gunakan variabel env tanpa diekspos ke client)
    // Pastikan di .env kamu ada: BACKEND_URL=http://127.0.0.1:5000
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:5000';
    
    // Meneruskan payload lengkap ke Flask
    const chatRequest = {
      message: chatMessage.trim(),
      session_id,
      user_id
    };

    console.log('Proxying request to Flask Backend:', `${backendUrl}/api/chat`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); 

    try {
      // PERUBAHAN: Pastikan path menuju endpoint Flask-mu benar (di page.tsx kamu menembak /api/chat)
      const backendResponse = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(chatRequest),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: `Backend service failed with status ${backendResponse.status}` };
        }
        
        return NextResponse.json(
          { 
            error: errorData.error || 'Backend service failed',
            status: 'error'
          },
          { status: backendResponse.status }
        );
      }

      const data: BackendChatResponse = await backendResponse.json();

      return NextResponse.json({
        answer: data.answer,
        question: data.question,
        status: data.status,
        sources: data.sources || []
      });

    } catch (fetchError: any) {
      clearTimeout(timeout);
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({ error: 'Request timed out.', status: 'error' }, { status: 408 });
      }
      return NextResponse.json({ error: 'Failed to connect to backend service.', status: 'error' }, { status: 503 });
    }
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process chat query', status: 'error' }, { status: 500 });
  }
}



// import { NextResponse } from 'next/server';
// import type { BackendChatResponse, ChatRequest } from '@/types/chat';

// export async function POST(request: Request) {
//   try {
//     const body = await request.json();
//     const message = body.message || body.question; // Support both field names for backward compatibility
    
//     if (!message || typeof message !== 'string') {
//       return NextResponse.json(
//         { error: 'Message is required and must be a string' },
//         { status: 400 }
//       );
//     }

//     // Backend URL - defaulting to localhost:5000 as per your example
//     const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:5000';
    
//     const chatRequest: ChatRequest = {
//       message: message.trim()
//     };

//     console.log('Sending request to backend:', `${backendUrl}/chat`);
//     console.log('Request payload:', chatRequest);

//     // Make request to your backend
//     const controller = new AbortController();
//     const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

//     try {
//       const backendResponse = await fetch(`${backendUrl}/chat`, {
//         method: 'POST',
//         headers: { 
//           'Content-Type': 'application/json',
//           'Accept': 'application/json',
//         },
//         body: JSON.stringify(chatRequest),
//         signal: controller.signal,
//       });

//       clearTimeout(timeout);

//       if (!backendResponse.ok) {
//         const errorText = await backendResponse.text();
//         console.error('Backend error response:', errorText);
        
//         let errorData;
//         try {
//           errorData = JSON.parse(errorText);
//         } catch {
//           errorData = { error: `Backend service failed with status ${backendResponse.status}` };
//         }
        
//         return NextResponse.json(
//           { 
//             error: errorData.error || 'Backend service failed',
//             status: 'error'
//           },
//           { status: backendResponse.status }
//         );
//       }

//       const data: BackendChatResponse = await backendResponse.json();
//       console.log('Backend response:', data);

//       // Validate response structure
//       if (!data.answer || data.status !== 'success') {
//         return NextResponse.json(
//           { 
//             error: data.answer || 'Invalid response from backend service',
//             status: 'error'
//           },
//           { status: 500 }
//         );
//       }

//       // Return the backend response directly as it matches our new interface
//       return NextResponse.json({
//         answer: data.answer,
//         question: data.question,
//         status: data.status,
//         sources: data.sources || []
//       });

//     } catch (fetchError: any) {
//       clearTimeout(timeout);
      
//       if (fetchError.name === 'AbortError') {
//         console.error('Request timed out');
//         return NextResponse.json(
//           { 
//             error: 'Request timed out. Please try again.',
//             status: 'error'
//           },
//           { status: 408 }
//         );
//       }
      
//       console.error('Network error:', fetchError);
//       return NextResponse.json(
//         { 
//           error: 'Failed to connect to backend service. Please ensure the backend is running.',
//           status: 'error',
//           details: process.env.NODE_ENV === 'development' ? fetchError.message : undefined
//         },
//         { status: 503 }
//       );
//     }
    
//   } catch (error: any) {
//     console.error('Chat API error:', error);
//     return NextResponse.json(
//       { 
//         error: error.message || 'Failed to process chat query',
//         status: 'error',
//         details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
//       },
//       { status: 500 }
//     );
//   }
// }
