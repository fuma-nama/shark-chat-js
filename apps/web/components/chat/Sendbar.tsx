import { FilePlusIcon, SendIcon, TextIcon, TrashIcon } from "lucide-react";
import { textArea } from "ui/components/textarea";
import { ReactNode, useRef, useState } from "react";
import { IconButton, button } from "ui/components/button";
import clsx from "clsx";
import React from "react";
import { contentSchema } from "shared/schema/chat";
import { Control, useController, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dynamic from "next/dynamic";

const GenerateTextModal = dynamic(() => import("../modal/GenerateTextModal"));

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
    const [openModal, setOpenModal] = useState<boolean | undefined>(undefined);
    const { control, handleSubmit, reset, formState, setValue, setFocus } =
        useForm<SendData>({
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
        <div className="sticky bottom-0 bg-background w-full mx-auto max-w-screen-2xl sm:px-4 sm:pb-4">
            <div
                className={clsx(
                    "flex flex-col gap-3 bg-light-50 shadow-xl shadow-brand-500/10 p-2 rounded-3xl dark:bg-dark-800 dark:shadow-none",
                    "max-sm:rounded-none max-sm:gap-1 max-sm:pb-7 max-sm:px-3.5"
                )}
            >
                {openModal !== undefined && (
                    <GenerateTextModal
                        open={openModal}
                        setOpen={setOpenModal}
                        onFocus={() => setFocus("content")}
                        setValue={(s) =>
                            setValue("content", s, {
                                shouldDirty: true,
                                shouldTouch: true,
                                shouldValidate: true,
                            })
                        }
                    />
                )}
                {children}
                <AttachmentPicker control={control} />
                <div className="flex flex-row">
                    <label
                        htmlFor="attachment"
                        className={button({
                            className: "w-9 h-9 p-2.5 mt-0.5 cursor-pointer",
                        })}
                    >
                        <FilePlusIcon />
                    </label>
                    <IconButton
                        className="w-9 h-9 p-2.5 mt-0.5 max-sm:hidden"
                        onClick={() => setOpenModal(true)}
                    >
                        <TextIcon />
                    </IconButton>
                    <TextArea
                        control={control}
                        onSend={onSend}
                        onType={onType}
                    />
                    <IconButton
                        disabled={!formState.isValid}
                        color="primary"
                        className="rounded-full w-9 h-9 p-2.5 mt-0.5"
                        onClick={onSend}
                    >
                        <SendIcon />
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
                    <p className="font-medium text-sm text-foreground">
                        {value.name}
                    </p>
                    <IconButton
                        size="small"
                        color="danger"
                        onClick={() => field.onChange(null)}
                    >
                        <TrashIcon className="w-4 h-4" />
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

function canSendSignal(lastType: Date | undefined, intervalSeconds: number) {
    if (lastType == null) return true;

    const min = new Date(lastType);
    min.setSeconds(min.getSeconds() + intervalSeconds);

    return new Date(Date.now()) > min;
}
