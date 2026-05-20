// // app/profile/page.tsx
// import { getCurrentUser } from "@/lib/auth";

// export default async function ProfilePage() {
//   const user = await getCurrentUser();

//   return (
//     <div className="p-8">
//       <h1 className="text-2xl font-bold">Profile</h1>
//       <pre>{JSON.stringify(user, null, 2)}</pre>
//     </div>
//   );
// }