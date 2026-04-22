import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const dummyUsers = [
  {
    id: "1",
    email: "admin@demo.com",
    password: "demo123",
    role: "admin"
  }
];

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const user = dummyUsers.find(u =>
          u.email === credentials?.email &&
          u.password === credentials?.password
        );
        return user || null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login"
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt"
  },
  debug: process.env.NODE_ENV === "development",
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // PASTIKAN FALSE di development
      },
    },
  },
  useSecureCookies: false, 
  trustHost: true, // Wajib untuk development saat pakai localhost
  events: {
    async signIn({ user }) {
      console.log("User signed in:", user.email);
    },
    async signOut() {
      console.log("User signed out");
    },
  },
};
