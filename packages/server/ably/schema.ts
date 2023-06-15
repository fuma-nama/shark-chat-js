import { z } from "zod";
import { a } from "ably-builder/builder";
import { inferProcedureOutput } from "@trpc/server";
import { AppRouter } from "../routers/_app";
import { Group, User } from "db/schema";

type ServerMessageType = inferProcedureOutput<
    AppRouter["chat"]["messages"]
>[number];

type ServerDirectChannelEvent = inferProcedureOutput<
    AppRouter["dm"]["channels"]
>[number];

type ServerGroupEvent = inferProcedureOutput<AppRouter["group"]["all"]>[number];

export const schema = {
    /**
     * Private channel for per user
     */
    private: a.channel(([clientId]: [clientId: string]) => [clientId], {
        group_created: a.event(z.custom<ServerGroupEvent>()),
        group_removed: a.event(z.custom<Pick<ServerGroupEvent, "id">>()),
        open_dm: a.event(z.custom<ServerDirectChannelEvent>()),
        close_dm: a.event(z.custom<{ channel_id: string }>()),
    }),
    group: a.channel(([group]: [groupId: number]) => [`${group}`], {
        group_updated: a.event(z.custom<Group>()),
        group_deleted: a.event(z.custom<Pick<ServerGroupEvent, "id">>()),
    }),
    chat: a.channel(([channel]: [channelId: string]) => [channel], {
        typing: a.event(
            z.object({ user: z.custom<Pick<User, "id" | "image" | "name">>() })
        ),
        message_sent: a.event(
            z.custom<ServerMessageType & { nonce?: number }>()
        ),
        message_updated: a.event(
            z.custom<
                Pick<
                    ServerMessageType,
                    "id" | "channel_id" | "content" | "embeds"
                >
            >()
        ),
        message_deleted: a.event(
            z.custom<Pick<ServerMessageType, "id" | "channel_id">>()
        ),
    }),
};
