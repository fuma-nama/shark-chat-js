import prisma from "@/server/prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import NextAuth, { DefaultSession, type AuthOptions } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";
import GithubProvider from "next-auth/providers/github";

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
    adapter: PrismaAdapter(prisma),
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_ID as string,
            clientSecret: process.env.GITHUB_SECRET as string,
        }),
    ],
    pages: {
        signIn: "/auth/signin",
        newUser: "/home/new",
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

export default NextAuth(authOptions);
