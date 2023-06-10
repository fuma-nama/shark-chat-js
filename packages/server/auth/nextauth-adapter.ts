import { Adapter, AdapterUser, VerificationToken } from "next-auth/adapters";
import db from "db/client";
import { sessions, accounts, members, users } from "db/schema";
import { and, eq } from "drizzle-orm";
import { oneOrNull, requireOne } from "db/utils";
import { createId } from "@paralleldrive/cuid2";
import redis from "../redis/client";
import { Serialize } from "shared/types";

const options = {
    verificationTokenKeyPrefix: "user:token:",
};

export const authAdapter: Adapter<true> = {
    async getUser(id) {
        return await db
            .select()
            .from(users)
            .where(eq(users.id, id))
            .then((res) => oneOrNull(res) as AdapterUser | null);
    },
    async getUserByEmail(email) {
        return await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .then((res) => oneOrNull(res) as AdapterUser | null);
    },
    async createUser(user) {
        const id = createId();

        await db.insert(users).values({
            email: user.email,
            emailVerified: user.emailVerified,
            image: user.image,
            name: user.name ?? undefined,
            id,
        });

        return { id, ...user };
    },
    async getUserByAccount(options) {
        const rows = await db
            .select({ user: users })
            .from(accounts)
            .where(
                and(
                    eq(accounts.provider, options.provider),
                    eq(accounts.providerAccountId, options.providerAccountId)
                )
            )
            .innerJoin(users, eq(users.id, accounts.userId));
        if (rows.length === 0) return null;

        return rows[0].user as AdapterUser;
    },
    async updateUser({ id, ...data }) {
        if (id == null) throw new Error("id can't be null");

        await db
            .update(users)
            .set({
                email: data.email,
                emailVerified: data.emailVerified,
                image: data.image,
                name: data.name ?? undefined,
            })
            .where(eq(users.id, id));

        return await db
            .select()
            .from(users)
            .where(eq(users.id, id))
            .then((res) => requireOne(res) as AdapterUser);
    },
    async deleteUser(id) {
        await db.delete(users).where(eq(users.id, id));

        await db.delete(members).where(eq(members.user_id, id));

        await db.delete(accounts).where(eq(accounts.userId, id));

        await db.delete(sessions).where(eq(sessions.userId, id));
    },
    async linkAccount(data) {
        const id = createId();

        await db.insert(accounts).values({
            ...data,
            id,
        });

        return { ...data, id };
    },
    async unlinkAccount({ provider, providerAccountId }) {
        await db
            .delete(accounts)
            .where(
                and(
                    eq(accounts.provider, provider),
                    eq(accounts.providerAccountId, providerAccountId)
                )
            );
    },
    async getSessionAndUser(sessionToken) {
        const rows = await db
            .select()
            .from(sessions)
            .where(eq(sessions.sessionToken, sessionToken))
            .innerJoin(users, eq(users.id, sessions.userId));

        if (rows.length === 0) return null;

        return { user: rows[0].User as AdapterUser, session: rows[0].Session };
    },
    async createSession(data) {
        const id = createId();

        await db.insert(sessions).values({
            ...data,
            id,
        });

        return { id, ...data };
    },
    async updateSession({ sessionToken, ...data }) {
        await db
            .update(sessions)
            .set({
                ...data,
            })
            .where(eq(sessions.sessionToken, sessionToken));

        return await db
            .select()
            .from(sessions)
            .where(eq(sessions.sessionToken, sessionToken))
            .then((res) => requireOne(res));
    },
    async deleteSession(sessionToken) {
        await db
            .delete(sessions)
            .where(eq(sessions.sessionToken, sessionToken));
    },
    async createVerificationToken(verificationToken) {
        redis.set(
            options.verificationTokenKeyPrefix +
                verificationToken.identifier +
                ":" +
                verificationToken.token,
            verificationToken
        );

        return verificationToken;
    },
    async useVerificationToken(verificationToken) {
        const tokenKey =
            options.verificationTokenKeyPrefix +
            verificationToken.identifier +
            ":" +
            verificationToken.token;

        const token = await redis.get<Serialize<VerificationToken>>(tokenKey);
        if (!token) return null;

        await redis.del(tokenKey);
        return {
            ...token,
            expires: new Date(token.expires),
        };
    },
};
