import { NextResponse } from 'next/server';
import { pdfParse } from 'pdf-parse';
import * as mammoth from 'mammoth';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let text = '';

    if (file.type === 'application/pdf') {
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (file.type.includes('word')) {
      const result = await mammoth.extractRawText({ arrayBuffer });
      text = result.value;
    } else {
      text = buffer.toString('utf-8');
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error('Extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract text from file' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};