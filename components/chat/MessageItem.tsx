import { Serialize } from "@/utils/types";
import type { Message } from "@prisma/client";
import { User } from "next-auth";
import Avatar from "../Avatar";

export function MessageItem({
    message,
}: {
    message: Serialize<Message & { author: User }>;
}) {
    return (
        <div className="p-3 rounded-xl bg-light-50 dark:bg-dark-800 flex flex-row gap-2 shadow-md dark:shadow-none shadow-brand-500/10">
            <Avatar
                src={message.author.image}
                fallback={message.author.name!!}
            />
            <div className="flex-1 flex flex-col">
                <div className="flex flex-row items-center">
                    <p className="font-semibold">{message.author.name}</p>
                    <p className="text-xs sm:text-xs text-accent-800 dark:text-accent-600 ml-auto sm:ml-2">
                        {new Date(message.timestamp).toLocaleString(undefined, {
                            dateStyle: "short",
                            timeStyle: "short",
                            hourCycle: "h24",
                        })}
                    </p>
                </div>
                <p className="whitespace-pre">{message.content}</p>
            </div>
        </div>
    );
}
