import { DefaultSession, AuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { DefaultJWT } from "next-auth/jwt";
import { authAdapter } from "./nextauth-adapter";
import db from "db";
import { users } from "db/schema";
import { eq } from "drizzle-orm";

declare module "next-auth" {
  interface Session extends Omit<DefaultSession, "user"> {
    user: {
      id: string;
      name: string;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT extends Record<string, string>, DefaultJWT {
    uid: string;
  }
}

export const authOptions: AuthOptions = {
  adapter: authAdapter,
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    newUser: "/home?modal=new",
  },
  callbacks: {
    session: async ({ session, token }) => {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, token.uid))
        .limit(1);

      // todo: Find a better way to check for deleted users
      if (user.length === 0) throw new Error("Invalid User");

      if (session.user != null) {
        session.user.id = token.uid;
      }
      return session;
    },
    jwt: async ({ user, token }) => {
      if (user != null) {
        token.uid = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
};
