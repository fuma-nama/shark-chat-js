import { FilePlusIcon, PaperPlaneIcon, TrashIcon } from "@radix-ui/react-icons";
import { textArea } from "@/components/system/textarea";
import { ReactNode, useEffect, useRef, useState } from "react";
import { IconButton, iconButton } from "@/components/system/button";
import clsx from "clsx";
import React from "react";
import { UserInfo, contentSchema } from "@/server/schema/chat";
import { Avatar } from "../system/avatar";
import { text } from "../system/text";
import { Control, useController, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z
    .object({
        content: contentSchema,
        attachment: z.custom<File>().nullable(),
    })
    .refine(
        ({ content, attachment }) =>
            content.trim().length !== 0 || attachment != null,
        {
            path: ["content"],
            message: "Message is empty",
        }
    );

export type SendData = z.infer<typeof schema>;

export function Sendbar({
    onSend: send,
    onType,
    children,
}: {
    onSend: (data: SendData) => void;
    onType: () => void;
    children?: ReactNode;
}) {
    const { control, handleSubmit, reset, formState } = useForm<SendData>({
        resolver: zodResolver(schema),
        defaultValues: {
            content: "",
            attachment: null,
        },
    });

    const onSend = handleSubmit(async (data) => {
        send(data);
        reset({ content: "", attachment: null });
    });

    return (
        <div className="sticky px-4 pb-4 bottom-0 bg-light-100 dark:bg-dark-900">
            <div
                className={clsx(
                    "flex flex-col gap-3 bg-light-50 shadow-xl shadow-brand-500/10 p-3 rounded-3xl max-w-[calc(1504px)] mx-auto",
                    "max-sm:-mx-4 max-sm:-mb-4 max-sm:rounded-none max-sm:gap-2",
                    "dark:shadow-none dark:bg-dark-800"
                )}
            >
                {children}
                <AttachmentPicker control={control} />
                <div className="flex flex-row gap-3">
                    <label
                        htmlFor="attachment"
                        className={iconButton({
                            className:
                                "aspect-square h-[41.6px] cursor-pointer",
                            color: "secondary",
                        })}
                    >
                        <FilePlusIcon />
                    </label>
                    <TextArea
                        control={control}
                        onSend={onSend}
                        onType={onType}
                    />
                    <IconButton
                        disabled={!formState.isValid}
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

function AttachmentPicker({ control }: { control: Control<SendData> }) {
    const {
        field: { value, ...field },
    } = useController({ control, name: "attachment" });

    return (
        <>
            <input
                {...field}
                id="attachment"
                type="file"
                className="hidden"
                onChange={(e) => {
                    const files = e.target.files;
                    if (files == null || files.length === 0) return;

                    field.onChange(files[0]);
                }}
            />
            {value != null && (
                <div className="rounded-xl bg-light-100 dark:bg-dark-700 p-3 flex flex-row justify-between items-center">
                    <p className={text({ size: "md", type: "primary" })}>
                        {value.name}
                    </p>
                    <IconButton
                        color="danger"
                        onClick={() => field.onChange(null)}
                    >
                        <TrashIcon />
                    </IconButton>
                </div>
            )}
        </>
    );
}

function TextArea({
    control,
    onSend,
    onType,
}: {
    control: Control<SendData>;
    onSend: () => void;
    onType: () => void;
}) {
    const { field } = useController({ control, name: "content" });
    const lastType = useRef<Date>();

    return (
        <textarea
            id="text"
            {...field}
            onChange={(e) => {
                field.onChange(e);

                if (canSendSignal(lastType.current, 2)) {
                    onType();
                    lastType.current = new Date(Date.now());
                }
            }}
            rows={Math.min(20, field.value.split("\n").length)}
            wrap="virtual"
            className={textArea({
                color: "primary",
                className: "resize-none h-auto max-h-[50vh]",
            })}
            placeholder="Type message"
            autoComplete="off"
            onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                    onSend();
                    e.preventDefault();
                }
            }}
        />
    );
}

type TypingData = {
    user: UserInfo;
    timestamp: Date;
};

function canSendSignal(lastType: Date | undefined, intervalSeconds: number) {
    if (lastType == null) return true;

    const min = new Date(lastType);
    min.setSeconds(min.getSeconds() + intervalSeconds);

    return new Date(Date.now()) > min;
}

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
                    fallback={data.user.name}
                    size="small"
                />
            ))}
            <p className={text({ size: "sm", type: "primary" })}>
                is typing...
            </p>
        </div>
    );
}
