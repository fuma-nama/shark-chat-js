import { ComplexMessage } from "server/utils/messages";
import { Serialize } from "@trpc/server/shared";

export type MessageType = Serialize<ComplexMessage>;
