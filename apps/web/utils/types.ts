import { RouterOutput } from "./trpc";

export type MessageType = RouterOutput["chat"]["messages"][number];
