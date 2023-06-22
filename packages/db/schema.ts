import { InferModel, sql } from "drizzle-orm";
import {
    int,
    mysqlTable,
    text,
    varchar,
    primaryKey,
    uniqueIndex,
    index,
    boolean,
    mysqlEnum,
    json,
    MySqlJsonBuilder,
} from "drizzle-orm/mysql-core";
import { timestamp } from "./utils/timestampUTC";

export const accounts = mysqlTable(
    "Account",
    {
        id: varchar("id", { length: 32 }).primaryKey().notNull(),
        userId: varchar("userId", { length: 32 }).notNull(),
        type: varchar("type", { length: 191 }).notNull(),
        provider: varchar("provider", { length: 191 }).notNull(),
        providerAccountId: varchar("providerAccountId", {
            length: 191,
        }).notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: int("expires_at"),
        token_type: varchar("token_type", { length: 30 }),
        scope: varchar("scope", { length: 191 }),
        id_token: text("id_token"),
        session_state: varchar("session_state", { length: 191 }),
    },
    (table) => ({
        Account_provider_providerAccountId_key: uniqueIndex(
            `Account_provider_providerAccountId_key`
        ).on(table.provider, table.providerAccountId),
        Account_userId_idx: index("Account_userId_idx").on(table.userId),
    })
);

export const directMessageInfos = mysqlTable(
    "DirectMessageInfo",
    {
        channel_id: varchar("channel_id", { length: 32 }).notNull(),
        user_id: varchar("user_id", { length: 191 }).notNull(),
        to_user_id: varchar("to_user_id", { length: 191 }).notNull(),
        open: boolean("open").default(true),
    },
    (table) => ({
        cpk: primaryKey(table.user_id, table.to_user_id),
    })
);

export const messageChannels = mysqlTable("MessageChannel", {
    id: varchar("id", { length: 32 }).primaryKey(),
    last_message_id: int("last_message_id"),
});

export const groups = mysqlTable(
    "Group",
    {
        id: int(`id`).notNull().autoincrement().primaryKey(),
        name: varchar(`name`, { length: 256 }).notNull(),
        unique_name: varchar(`unique_name`, { length: 32 }).notNull(),
        icon_hash: int(`icon_hash`),
        channel_id: varchar("channel_id", { length: 32 }).notNull().default(""),
        owner_id: varchar(`owner_id`, { length: 191 }).notNull(),
        public: boolean(`public`).notNull().default(false),
    },
    (table) => ({
        Group_unique_name_key: uniqueIndex(`Group_unique_name_key`).on(
            table.unique_name
        ),
        Group_channel_idx: index(`Group_channel_idx`).on(table.channel_id),
    })
);

export const groupInvites = mysqlTable(
    "GroupInvite",
    {
        group_id: int(`group_id`).notNull(),
        code: varchar("code", { length: 191 }).notNull().primaryKey(),
    },
    (table) => ({
        group_idx: index("GroupInvite_group_id_idx").on(table.group_id),
    })
);

export const members = mysqlTable(
    `Member`,
    {
        group_id: int(`group_id`).notNull(),
        user_id: varchar(`user_id`, { length: 191 }).notNull(),
    },
    (table) => ({
        cpk: primaryKey(table.group_id, table.user_id),
        Member_group_id_idx: index(`Member_group_id_idx`).on(table.group_id),
        Member_user_id_idx: index(`Member_user_id_idx`).on(table.user_id),
    })
);

export type Embed = {
    url: string;
    title?: string;
    description?: string;
    image?: {
        url: string;
        width: number;
        height: number;
    };
};

export const messages = mysqlTable(
    "Message",
    {
        id: int(`id`).autoincrement().notNull().primaryKey(),
        author_id: varchar(`author_id`, { length: 191 }).notNull(),
        channel_id: varchar("channel_id", { length: 32 }).notNull(),
        content: varchar(`content`, { length: 2000 }).notNull(),
        timestamp: timestamp(`timestamp`, { fsp: 3 })
            .notNull()
            .default(sql`CURRENT_TIMESTAMP(3)`),
        attachment_id: varchar(`attachment_id`, { length: 32 }),
        embeds: json("embeds") as MySqlJsonBuilder<{
            name: "embeds";
            data: Embed[];
            driverParam: string;
            notNull: false;
            hasDefault: false;
        }>,
        reply_id: int("reply_id"),
    },
    (table) => ({
        Message_channel_id_idx: index("Message_channel_id_idx").on(
            table.channel_id
        ),
        Message_timestamp_idx: index("Message_timestamp_idx").on(
            table.timestamp
        ),
    })
);

export const sessions = mysqlTable(
    `Session`,
    {
        id: varchar(`id`, { length: 191 }).notNull().primaryKey(),
        sessionToken: varchar(`sessionToken`, { length: 191 }).notNull(),
        userId: varchar(`userId`, { length: 191 }).notNull(),
        expires: timestamp(`expires`, { fsp: 3 }).notNull(),
    },
    (table) => ({
        Session_sessionToken_key: uniqueIndex(`Session_sessionToken_key`).on(
            table.sessionToken
        ),
        Session_userId_idx: index(`Session_userId_idx`).on(table.userId),
    })
);

export const users = mysqlTable(
    "User",
    {
        id: varchar(`id`, { length: 191 }).notNull().primaryKey(),
        name: varchar(`name`, { length: 191 }).notNull().default("User"),
        email: varchar(`email`, { length: 191 }),
        emailVerified: timestamp(`emailVerified`, { fsp: 3 }),
        image: varchar(`image`, { length: 191 }),
        is_ai: boolean(`is_ai`).notNull().default(false),
    },
    (table) => ({
        User_email_key: uniqueIndex(`User_email_key`).on(table.email),
    })
);

export const attachments = mysqlTable("Attachment", {
    id: varchar(`id`, { length: 32 }).notNull().primaryKey(),
    name: varchar(`name`, { length: 255 }).notNull(),
    url: varchar(`url`, { length: 255 }).notNull(),

    type: mysqlEnum("type", ["image", "video", "raw"]).notNull(),
    bytes: int("bytes").notNull(),
    width: int("width"),
    height: int("height"),
});

export type Group = InferModel<typeof groups>;
export type User = InferModel<typeof users>;
export type Message = InferModel<typeof messages>;
export type MessageChannel = InferModel<typeof messageChannels>;
export type DirectMessageInfo = InferModel<typeof directMessageInfos>;
export type GroupInvite = InferModel<typeof groupInvites>;
export type Member = InferModel<typeof members>;
export type Attachment = InferModel<typeof attachments>;
