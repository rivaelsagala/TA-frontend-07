// import { NextResponse } from 'next/server';
// import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
// import { getServerSession } from 'next-auth';

// export async function POST() {
//   const session = await getServerSession(authOptions);
  
//   if (!session) {
//     return NextResponse.json(
//       { error: 'Not authenticated' },
//       { status: 401 }
//     );
//   }

//   return NextResponse.json({ success: true });
// }