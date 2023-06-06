import { groupSchema } from "@/server/schema/group";
import type { UserInfo } from "@/server/schema/chat";
import { z } from "zod";
import { a } from "./builder";
import { hash } from "../common";
import { inferProcedureOutput } from "@trpc/server";
import { AppRouter } from "@/server/routers/_app";

type ServerMessageType = inferProcedureOutput<
    AppRouter["chat"]["messages"]
>[number];

type ServerDirectChannelEvent = {};

function dmKey(user1: string, user2: string): [user1: string, user2: string] {
    if (hash(user1) > hash(user2)) {
        return [user1, user2];
    } else {
        return [user2, user1];
    }
}

export const schema = {
    /**
     * Private channel for per user
     */
    private: a.channel(([clientId]: [clientId: string]) => [clientId], {
        group_created: a.event(groupSchema),
        group_removed: a.event(groupSchema.pick({ id: true })),
        open_dm: a.event(z.custom<ServerDirectChannelEvent>()),
    }),
    group: a.channel(([group]: [groupId: number]) => [`${group}`], {
        group_updated: a.event(groupSchema),
        group_deleted: a.event(groupSchema.pick({ id: true })),
    }),
    chat: a.channel(([channel]: [channelId: string]) => [channel], {
        typing: a.event(z.object({ user: z.custom<UserInfo>() })),
        message_sent: a.event(
            z.custom<ServerMessageType & { nonce?: number }>()
        ),
        message_updated: a.event(
            z.custom<Pick<ServerMessageType, "id" | "channel_id" | "content">>()
        ),
        message_deleted: a.event(
            z.custom<Pick<ServerMessageType, "id" | "channel_id">>()
        ),
    }),
};
