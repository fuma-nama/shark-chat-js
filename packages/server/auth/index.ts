import { AuthOptions, DefaultSession } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import DiscordProvider from "next-auth/providers/discord";

import { DefaultJWT } from "next-auth/jwt";
import { authAdapter } from "./nextauth-adapter";

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
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    newUser: "/?modal=new",
  },
  callbacks: {
    session: async ({ session, token }) => {
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
