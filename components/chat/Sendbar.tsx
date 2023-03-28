import { PaperPlaneIcon } from "@radix-ui/react-icons";
import { textArea } from "@/components/system/textarea";
import { useState } from "react";
import { IconButton } from "@/components/system/button";
import clsx from "clsx";
import React from "react";

type Data = {
    content: string;
};

export function Sendbar({
    onSend: send,
    isLoading,
}: {
    onSend: (data: Data) => Promise<unknown>;
    isLoading: boolean;
}) {
    const [text, setText] = useState("");

    const onSend = async () => {
        await send({ content: text });

        setText("");
    };

    return (
        <div className="sticky pb-4 -mb-4 bottom-0 mt-auto bg-light-100 dark:bg-dark-900">
            <div
                className={clsx(
                    "flex flex-row gap-3 bg-light-50 shadow-xl shadow-brand-500/10 dark:shadow-none dark:bg-dark-800 p-3 rounded-3xl",
                    "max-sm:-m-4 max-sm:rounded-none max-sm:gap-2"
                )}
            >
                <textarea
                    id="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={Math.min(20, text.split("\n").length)}
                    wrap="virtual"
                    className={textArea({
                        color: "primary",
                        className: "resize-none h-auto max-h-[50vh]",
                    })}
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
                    disabled={isLoading || text.trim().length === 0}
                    className="aspect-square h-[41.6px]"
                    onClick={onSend}
                >
                    <PaperPlaneIcon />
                </IconButton>
            </div>
        </div>
    );
}
