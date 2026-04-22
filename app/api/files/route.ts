import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { generateEmbedding } from '@/lib/embeddings';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const fileId = uuidv4();

// Supported file types with their handlers
const FILE_HANDLERS = {
  // PDF files
  'application/pdf': {
    extract: async (buffer: ArrayBuffer) => {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
      
      try {
        const loadingTask = pdfjs.getDocument(new Uint8Array(buffer));
        const pdf = await loadingTask.promise;
        
        let extractedText = '';
        const maxPages = Math.min(pdf.numPages, 10);
        
        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          extractedText += textContent.items.map(item => item.str).join(' ');
        }
        
        return extractedText;
      } catch (error) {
        console.error('PDF extraction error:', error);
        throw new Error('Failed to extract text from PDF');
      }
    }
  },
  // Word documents
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    extract: async (buffer: ArrayBuffer) => {
      const { extractRawText } = await import('mammoth');
      const result = await extractRawText({ buffer: Buffer.from(buffer) });
      return result.value;
    }
  },
  'application/msword': {
    extract: async (buffer: ArrayBuffer) => {
      const { extractRawText } = await import('mammoth');
      const result = await extractRawText({ buffer: Buffer.from(buffer) });
      return result.value;
    }
  },
  // Text files
  'text/plain': {
    extract: async (buffer: ArrayBuffer) => {
      return new TextDecoder().decode(buffer);
    }
  },
  // CSV files
  'text/csv': {
    extract: async (buffer: ArrayBuffer) => {
      return new TextDecoder().decode(buffer);
    }
  },
  // Excel files
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    extract: async (buffer: ArrayBuffer) => {
      const { read, utils } = await import('xlsx');
      const workbook = read(buffer);
      let text = '';
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        text += utils.sheet_to_csv(worksheet) + '\n\n';
      });
      return text;
    }
  },
  'application/vnd.ms-excel': {
    extract: async (buffer: ArrayBuffer) => {
      const { read, utils } = await import('xlsx');
      const workbook = read(buffer);
      let text = '';
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        text += utils.sheet_to_csv(worksheet) + '\n\n';
      });
      return text;
    }
  }
};

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel'
];

const BUCKET_NAME = 'files';

// GET handler for both listing files and downloading
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('id');

  // Handle file download
  if (fileId) {
    try {
      // 1. Get file info from database
      const { data: file, error: dbError } = await supabase
        .from('files')
        .select('url, name, type')
        .eq('id', fileId)
        .single();

      if (dbError || !file) {
        return NextResponse.json(
          { error: 'File not found in database' },
          { status: 404 }
        );
      }

      // Extract file path from URL
      if (!file.url) {
        return NextResponse.json(
          { error: 'File URL is missing' },
          { status: 400 }
        );
      }

      // 2. Create signed URL for private bucket access
      const { data: signedUrl } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(file.url.split('/files/')[1], 3600); // 1 hour expiry

      if (!signedUrl) {
        throw new Error('Failed to generate download URL');
      }

      // 3. Return the signed URL and file metadata
      return NextResponse.json({
        downloadUrl: signedUrl.signedUrl,
        fileName: file.name,
        fileType: file.type
      });

    } catch (error) {
      console.error('Download error:', error);
      return NextResponse.json(
        { 
          error: 'Download failed',
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }
  }

  // Default GET behavior - list all files
  try {
    const { data: files, error } = await supabase
      .from('files')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    const fileData = files.map(file => ({
      id: file.id || uuidv4(),
      name: file.name,
      type: file.type,
      size: file.size,
      url: file.url,
      uploadedAt: file.uploaded_at || new Date().toISOString()
    }));

    return NextResponse.json({ files: fileData });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}

// POST handler: upload and process file
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    let fileId = uuidv4();

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);

    // Validate file type
    const fileType = file.type || getFileTypeFromExtension(file.name);
    if (!fileType || !ALLOWED_TYPES.includes(fileType)) {
      return NextResponse.json(
        { 
          error: 'Unsupported file type',
          details: `File type ${fileType} is not supported`,
          supportedTypes: ALLOWED_TYPES
        },
        { status: 400 }
      );
    }

    // 1. Extract text from file
    let content: string;
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Handle PDF secara khusus
      if (fileType === 'application/pdf') {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        
        const loadingTask = pdfjs.getDocument(new Uint8Array(arrayBuffer));
        const pdf = await loadingTask.promise;
        
        content = '';
        const maxPages = Math.min(pdf.numPages, 10);
        
        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          content += textContent.items.map(item => item.str).join(' ');
        }
      } else {
        // Handler untuk tipe file lainnya
        const handler = FILE_HANDLERS[fileType as keyof typeof FILE_HANDLERS];
        if (!handler) throw new Error(`No handler for file type: ${fileType}`);
        content = await handler.extract(arrayBuffer);
      }
      
      if (!content.trim()) {
        throw new Error('Extracted content is empty');
      }
    } catch (extractError) {
      console.error('Extraction failed:', extractError);
      return NextResponse.json(
        { 
          error: 'Failed to extract text from file',
          details: extractError instanceof Error ? extractError.message : 'Unknown extraction error',
          fileType: fileType
        },
        { status: 400 }
      );
    }

    console.log(`Successfully extracted text (${content.length} chars)`);

    // 2. Generate embedding
    let embedding;
    try {
      embedding = await generateEmbedding(content);
      if (!embedding) {
        throw new Error('Embedding generation returned empty result');
      }
    } catch (embeddingError) {
      console.error('Embedding generation failed:', embeddingError);
      return NextResponse.json(
        { 
          error: 'Failed to generate embedding',
          details: embeddingError instanceof Error ? embeddingError.message : 'Backend embedding service failed',
          contentSample: content.substring(0, 100) + '...'
        },
        { status: 500 }
      );
    }

    // 3. Handle storage bucket
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) throw listError;
      
      const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);
      
      // Create bucket if needed
      if (!bucketExists) {
        console.log('Creating storage bucket...');
        const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
          public: true,
          allowedMimeTypes: ALLOWED_TYPES,
          fileSizeLimit: 50 * 1024 * 1024, // 50MB
        });
        if (createError) throw createError;
      }
    } catch (bucketError) {
      console.error('Storage setup error:', bucketError);
      return NextResponse.json(
        { 
          error: 'Storage configuration failed',
          details: 'Please check your Supabase storage permissions',
          solution: 'Ensure service role key has storage admin privileges'
        },
        { status: 500 }
      );
    }

    // 4. Upload file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = `uploads/${fileName}`;
    const fileBuffer = await file.arrayBuffer();

    try {
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, fileBuffer, {
          contentType: file.type,
          upsert: false,
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;
    } catch (uploadError) {
      console.error('Upload failed:', uploadError);
      return NextResponse.json(
        { 
          error: 'File upload failed',
          details: uploadError instanceof Error ? uploadError.message : 'Storage service error'
        },
        { status: 500 }
      );
    }

const { error: ragUploadError } = await supabase
  .from('documents')
  .insert({
    content: content,
    embedding: embedding,
    metadata: {
      file_id: fileId,
      file_name: file.name,
      file_type: file.type,
      upload_date: new Date().toISOString(),
      source: "web-upload"
    }
  });

if (ragUploadError) {
  console.error("RAG document upload failed:", ragUploadError);
  return NextResponse.json(
    { 
      error: 'Failed to save document to RAG system',
      details: ragUploadError.message
    },
    { status: 500 }
  );
}


    // 5. Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    // 6. Save to database
    try {
      const { data: dbData, error: dbError } = await supabase
        .from('files')
        .insert({
          id: fileId,
          name: file.name,
          type: fileExt,
          size: file.size,
          url: urlData.publicUrl,
          content: content,
          embedding: embedding,
          uploaded_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (dbError) throw dbError;
      fileId = dbData.id;

      // 7. Process with RAG
      try {
        
        // Create temp directory if not exists
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        // Save file temporarily for RAG processing
        const tempFilePath = path.join(tempDir, fileName);
        await writeFileAsync(tempFilePath, Buffer.from(fileBuffer));
        
        // Process with RAG
        await ragService.processAndStoreDocument(
          fileBuffer,
          file.name,
          file.type,
          fileId
        );
        
        // Clean up temp file
        await unlinkAsync(tempFilePath);
      } catch (ragError) {
        console.error('RAG processing failed (non-critical):', ragError);
        // Continue even if RAG fails as it's not critical for the upload
      }

      return NextResponse.json(
        {
          success: true,
          file: dbData
        },
        { status: 201 }
      );
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Attempt to delete the uploaded file if DB fails
      await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      return NextResponse.json(
        { 
          error: 'Database operation failed',
          details: dbError instanceof Error ? dbError.message : 'Failed to save file metadata'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE handler with improved error handling
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const fileId = params.id;
  

  if (!fileId) {
    return NextResponse.json(
      { error: 'File ID is required' },
      { status: 400 }
    );
  }

  try {
    // 1. Get file info from database
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('url, name')
      .eq('id', fileId)
      .single();

    if (fileError || !file) {
      return NextResponse.json(
        { error: 'File not found in database' },
        { status: 404 }
      );
    }

    // 2. Extract path from URL
    const url = new URL(file.url);
    const filePath = url.pathname.split('/storage/v1/object/public/files/')[1];

    if (!filePath) {
      throw new Error('Could not extract file path from URL');
    }

    // 3. Delete from storage
    const { error: storageError } = await supabase.storage
      .from('files')
      .remove([filePath]);

    if (storageError) throw storageError;

    // 4. Delete from database
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId);

    if (dbError) throw dbError;

    // 5. Delete from RAG documents (if exists)
    try {
      const { error: ragDeleteError } = await supabase
        .from('documents')
        .delete()
        .eq('metadata->>file_id', fileId);

      if (ragDeleteError) {
        console.error('Error deleting RAG documents:', ragDeleteError);
      }
    } catch (ragError) {
      console.error('Error cleaning up RAG documents:', ragError);
    }

    return NextResponse.json({ 
      success: true,
      message: `File ${file.name} deleted successfully`
    });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete file',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Helper function to get file type from extension
function getFileTypeFromExtension(filename: string): string | null {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (!extension) return null;

  const extensionMap: Record<string, string> = {
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'doc': 'application/msword',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls': 'application/vnd.ms-excel'
  };

  return extensionMap[extension] || null;
}