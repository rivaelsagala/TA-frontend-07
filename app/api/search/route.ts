// import { supabase } from '@/lib/supabase/client';
// import { NextResponse } from 'next/server';
// import { generateEmbedding } from '@/lib/embeddings';

// export async function POST(request: Request) {
//   const { query } = await request.json();

//   if (!query) {
//     return NextResponse.json({ error: 'Query kosong' }, { status: 400 });
//   }

//   try {
//     // 1. Generate embedding untuk query
//     const embedding = await generateEmbedding(query);

//     // 2. Panggil fungsi search_files dari Supabase
//     const { data, error } = await supabase.rpc('search_files', {
//       query_embedding: embedding,
//       similarity_threshold: 0.7,
//     });

//     if (error) {
//       console.error('Supabase RPC error:', error);
//       throw error;
//     }

//     // 3. Format ulang hasil jika ada
//     const files = (data || []).map((file: any) => ({
//       id: file.id,
//       name: file.name,
//       type: file.type,
//       size: file.size,
//       url: file.url,
//       uploadedAt: file.uploaded_at,
//       similarity: file.similarity,
//     }));

//     return NextResponse.json({ files });
//   } catch (error) {
//     console.error('Search error:', error);
//     return NextResponse.json({ error: 'Gagal mencari' }, { status: 500 });
//   }
// }