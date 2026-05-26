import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { sql } from "./db";

interface DBUser {
  id: string;
  name: string;
  email: string;
  password_hash: string | null;
}

// Fall back to DATABASE_URL so the only required env var is the DB connection string.
// Both middleware and authOptions must use the same value.
export const authSecret = process.env.NEXTAUTH_SECRET ?? process.env.DATABASE_URL;

export const authOptions: NextAuthOptions = {
  secret: authSecret,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const rows = (await sql`SELECT * FROM users WHERE email = ${credentials.email.toLowerCase()}`) as DBUser[];
          const user = rows[0];
          if (!user || !user.password_hash) return null;
          const valid = await bcrypt.compare(credentials.password, user.password_hash);
          if (!valid) return null;
          return { id: user.id, email: user.email, name: user.name };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as { id?: string }).id = token.id as string;
      return session;
    },
  },
};
