import { PaperPlaneIcon } from "@radix-ui/react-icons";
import { textArea } from "@/components/system/textarea";
import { ReactNode, useEffect, useRef, useState } from "react";
import { IconButton } from "@/components/system/button";
import clsx from "clsx";
import React from "react";
import { UserInfo } from "@/server/schema/chat";
import { Avatar } from "../system/avatar";
import { text } from "../system/text";

export type SendData = {
    content: string;
};

function canSend(lastType: Date, intervalSeconds: number) {
    const min = new Date(lastType);
    min.setSeconds(min.getSeconds() + intervalSeconds);

    return new Date(Date.now()) > min;
}

export function Sendbar({
    onSend: send,
    isLoading,
    onType,
    children,
}: {
    onSend: (data: SendData) => void;
    onType: () => void;
    isLoading: boolean;
    children?: ReactNode;
}) {
    const lastType = useRef<Date>();
    const [text, setText] = useState("");

    const onSend = () => {
        setText("");
        send({ content: text });
    };

    return (
        <div className="sticky px-4 pb-4 bottom-0 mt-auto bg-light-100 dark:bg-dark-900">
            <div
                className={clsx(
                    "flex flex-col gap-3 bg-light-50 shadow-xl shadow-brand-500/10 p-3 rounded-3xl max-w-[calc(1504px)] mx-auto",
                    "max-sm:-mx-4 max-sm:-mb-4 max-sm:rounded-none max-sm:gap-2",
                    "dark:shadow-none dark:bg-dark-800"
                )}
            >
                {children}
                <div className="flex flex-row gap-3">
                    <textarea
                        id="text"
                        value={text}
                        onChange={(e) => {
                            setText(e.target.value);

                            if (
                                lastType.current == null ||
                                canSend(lastType.current, 2)
                            ) {
                                onType();
                                lastType.current = new Date(Date.now());
                            }
                        }}
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
                        disabled={isLoading || text.trim().length === 0}
                        className="aspect-square h-[41.6px]"
                        onClick={onSend}
                    >
                        <PaperPlaneIcon />
                    </IconButton>
                </div>
            </div>
        </div>
    );
}

type TypingData = {
    user: UserInfo;
    timestamp: Date;
};

export function useTypingStatus() {
    const [typing, setTyping] = useState<TypingData[]>([]);

    useEffect(() => {
        const timer = setInterval(() => {
            const last = new Date(Date.now());
            last.setSeconds(last.getSeconds() - 5);

            setTyping((prev) => prev.filter((data) => data.timestamp >= last));
        }, 5000);

        return () => {
            clearInterval(timer);
        };
    }, []);

    return {
        typing,
        add: (user: UserInfo) => {
            const data: TypingData = {
                user,
                timestamp: new Date(Date.now()),
            };

            setTyping((prev) =>
                prev.some((u) => u.user.id === data.user.id)
                    ? prev
                    : [...prev, data]
            );
        },
    };
}

export function TypingStatus({ typing }: { typing: TypingData[] }) {
    if (typing.length === 0) return <></>;

    return (
        <div className="flex flex-row gap-1 items-center">
            {typing.map((data) => (
                <Avatar
                    key={data.user.id}
                    src={data.user.image}
                    size="small"
                    border="wide"
                />
            ))}
            <p className={text({ size: "sm", type: "primary" })}>
                is typing...
            </p>
        </div>
    );
}
