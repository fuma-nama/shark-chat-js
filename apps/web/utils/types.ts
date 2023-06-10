import { RouterOutput } from "./trpc";

export type DMChannel = RouterOutput["dm"]["channels"][number];

export type MessageType = RouterOutput["chat"]["messages"][number];
