 
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

const BUCKET_NAME = 'files';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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
      console.error('File not found:', fileError);
      return NextResponse.json(
        { error: 'File not found in database' },
        { status: 404 }
      );
    }

    // 2. Extract path from URL
    const url = new URL(file.url);
    const filePath = url.pathname.split('/storage/v1/object/public/files/')[1];

    if (!filePath) {
      throw new Error('Invalid file URL format');
    }

    // 3. Delete from storage (using service role key)
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
      throw storageError;
    }

    // 4. Delete from database
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId);

    if (dbError) throw dbError;

    return NextResponse.json({ 
      success: true,
      message: `File ${file.name} deleted successfully`
    });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete file',
        details: error instanceof Error ? error.message : String(error),
        solution: 'Please check if the file exists and you have proper permissions'
      },
      { status: 500 }
    );
  }
}