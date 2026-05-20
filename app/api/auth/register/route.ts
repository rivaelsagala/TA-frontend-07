// import { NextResponse } from "next/server";
// import User from "@/utils/database/user";
// import dbConnect from "@/lib/dbConnect";
// import bcrypt from "bcryptjs";

// export async function POST(request: Request) {
//   try {
//     await dbConnect();
//     const { email, password } = await request.json();

//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return NextResponse.json(
//         { error: "Email already exists" },
//         { status: 400 }
//       );
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = new User({ email, password: hashedPassword });
//     await user.save();

//     return NextResponse.json(
//       { message: "User created successfully" },
//       { status: 201 }
//     );
//   } catch (error) {
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }