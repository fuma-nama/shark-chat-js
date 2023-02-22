import { trpc } from "@/utils/trpc";
import { PaperPlaneIcon } from "@radix-ui/react-icons";
import Textarea from "@/components/input/Textarea";
import { useState } from "react";
import IconButton from "@/components/IconButton";
import clsx from "clsx";
import React from "react";

export function Sendbar({ group }: { group: number }) {
    const [text, setText] = useState("");

    const send = trpc.chat.send.useMutation({
        onSuccess: (data) => {
            setText("");
        },
    });

    const onSend = () => {
        send.mutate({
            groupId: group,
            message: text,
        });
    };

    return (
        <div className="sticky pb-4 -mb-4 bottom-0 mt-auto bg-light-100 dark:bg-dark-900">
            <div
                className={clsx(
                    "flex flex-row gap-3 bg-light-50 shadow-xl shadow-brand-500/10 dark:shadow-none dark:bg-dark-800 p-3 rounded-3xl",
                    "max-sm:-m-4 max-sm:rounded-none max-sm:gap-2"
                )}
            >
                <Textarea
                    id="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={Math.min(20, text.split("\n").length)}
                    wrap="virtual"
                    className="resize-none h-auto max-h-[50vh]"
                    placeholder="Type message"
                    autoComplete="off"
                    onKeyDown={(e) => {
                        if (e.shiftKey && e.key === "Enter") {
                            onSend();
                            e.preventDefault();
                        }
                    }}
                />
                <IconButton
                    type="submit"
                    disabled={send.isLoading || text.trim().length === 0}
                    className="aspect-square h-[41.6px]"
                    onClick={onSend}
                >
                    <PaperPlaneIcon />
                </IconButton>
            </div>
        </div>
    );
}
