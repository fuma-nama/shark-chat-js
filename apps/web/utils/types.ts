import { RouterOutput } from "./trpc";

export type DMChannel = RouterOutput["dm"]["channels"][number];

export type MessageType = RouterOutput["chat"]["messages"][number];

export type GroupWithNotifications = RouterOutput["group"]["all"][number];
