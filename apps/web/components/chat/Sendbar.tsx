import {
  BrainIcon,
  ChevronDownIcon,
  PlusIcon,
  SendIcon,
  TrashIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { textArea } from "ui/components/textarea";
import React, { HTMLAttributes, useEffect, useRef, useState } from "react";
import { button, IconButton } from "ui/components/button";
import { contentSchema } from "shared/schema/chat";
import {
  Control,
  FormProvider,
  useController,
  useForm,
  useFormContext,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dynamic from "next/dynamic";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "ui/components/dropdown";
import { getViewportScroll } from "@/components/chat/ChatView";
import { useMessageStore } from "@/utils/stores/chat";
import { useSendMessageMutation } from "@/utils/hooks/mutations/send-message";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { trpc } from "@/utils/trpc";
import { cn } from "ui/utils/cn";

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
    },
  );

export type SendData = z.infer<typeof schema>;

export function Sendbar({ channelId }: { channelId: string }) {
  const utils = trpc.useUtils();
  const form = useForm<SendData>({
    resolver: zodResolver(schema),
    defaultValues: {
      content: "",
      attachment: null,
    },
  });

  const mutation = useSendMessageMutation();

  const onEscape = () => {
    useMessageStore.getState().updateReply(channelId, null);
  };

  const onSubmit = form.handleSubmit(async (data) => {
    const store = useMessageStore.getState();
    const reply = store.reply.get(channelId);

    mutation.mutate({
      ...data,
      channelId: channelId,
      reply: reply?.id,
      nonce: store.addSending(channelId, data, reply).nonce,
    });

    onEscape();

    form.reset({ content: "", attachment: null });
  });

  return (
    <div className="sticky z-20 bottom-0 bg-background w-full sm:px-4 sm:pb-4">
      <RollbackButton />
      <FormProvider {...form}>
        <div className="flex flex-col gap-3 pt-2 pb-7 px-3.5 bg-muted/50 sm:rounded-3xl sm:bg-secondary sm:p-2">
          <TypingIndicator channelId={channelId} />
          <Reference channelId={channelId} />
          <AttachmentPicker control={form.control} />
          <div className="flex flex-row items-center gap-2">
            <Options />
            <TextArea
              control={form.control}
              onSignal={() => {
                void utils.client.chat.type.mutate({ channelId });
                /* Experimental typing signal
                const profile = utils.account.get.getData();
                if (!profile) return;

                void ably.channels.get(`chat:${channelId}:typing`).publish({
                  data: {
                    channelId,
                    user: {
                      id: profile.id,
                      name: profile.name,
                      image: profile.image,
                    },
                  },
                });
                 */
              }}
              onPaste={(e) => {
                if (e.clipboardData.files.length > 0) {
                  e.preventDefault();
                  form.setValue("attachment", e.clipboardData.files[0], {
                    shouldDirty: true,
                  });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  void onSubmit();
                  e.preventDefault();
                }

                if (e.key === "Escape") {
                  onEscape();
                  e.preventDefault();
                }
              }}
            />
            <IconButton
              disabled={!form.formState.isValid}
              color="primary"
              className="size-8 rounded-full p-0 disabled:hidden sm:m-0.5"
              onClick={onSubmit}
            >
              <SendIcon className="size-4 -translate-x-px translate-y-px" />
            </IconButton>
          </div>
        </div>
      </FormProvider>
    </div>
  );
}

function Reference({ channelId }: { channelId: string }) {
  const reply = useMessageStore((s) => s.reply.get(channelId));

  return (
    <div
      className={cn(
        "flex flex-row pt-2 px-2 text-sm text-muted-foreground",
        !reply && "hidden",
      )}
    >
      <p className="flex-1">
        Replying to{" "}
        <span className="font-medium text-foreground">
          {reply?.author?.name ?? "Unknown User"}
        </span>
      </p>
      <button
        aria-label="delete"
        className={button({ color: "ghost", size: "icon" })}
        onClick={() => useMessageStore.getState().updateReply(channelId, null)}
      >
        <XIcon className="size-4" />
      </button>
    </div>
  );
}

function Options() {
  const form = useFormContext<SendData>();
  const [openModal, setOpenModal] = useState<boolean | undefined>(undefined);

  return (
    <DropdownMenu>
      {openModal !== undefined && (
        <GenerateTextModal
          open={openModal}
          setOpen={setOpenModal}
          onFocus={() => form.setFocus("content")}
          setValue={(s) =>
            form.setValue("content", s, {
              shouldDirty: true,
              shouldTouch: true,
            })
          }
        />
      )}
      <DropdownMenuTrigger
        aria-label="Trigger Menu"
        className={button({
          className:
            "size-6 p-0 rounded-full text-background bg-muted-foreground hover:bg-accent-foreground sm:m-1.5",
        })}
      >
        <PlusIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => setOpenModal(true)}>
          <BrainIcon className="size-4" />
          Generate Text
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <label htmlFor="attachment">
            <UploadIcon className="size-4" />
            Upload File
          </label>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RollbackButton() {
  const [canRollback, setCanRollback] = useState(false);

  useEffect(() => {
    const node = getViewportScroll();
    if (!node) return;

    const listener = () => {
      const diff = node.scrollHeight - (node.scrollTop + node.clientHeight);

      setCanRollback(diff > 500);
    };

    node.addEventListener("scroll", listener);
    return () => {
      node.removeEventListener("scroll", listener);
    };
  }, []);

  const onClick = () => {
    const node = getViewportScroll();

    if (node) node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  };

  return (
    <button
      className={button({
        size: "icon",
        className: [
          "absolute top-0 right-4 -mt-12 rounded-full z-[-1] transition-all",
          !canRollback && "opacity-0 translate-y-20",
        ],
      })}
      onClick={onClick}
    >
      <ChevronDownIcon className="size-5" />
    </button>
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
        <div className="rounded-xl bg-secondary p-3 flex flex-row justify-between items-center">
          <div>
            <p className="font-medium text-sm">{value.name}</p>
            <p className="text-xs text-muted-foreground">
              {Math.round(value.size / 1024)}KB
            </p>
          </div>
          <IconButton
            size="icon"
            color="danger"
            onClick={() => field.onChange(null)}
          >
            <TrashIcon className="size-4" />
          </IconButton>
        </div>
      )}
    </>
  );
}

function TextArea({
  control,
  onSignal,
  ...props
}: {
  control: Control<SendData>;
  onSignal: () => void;
} & HTMLAttributes<HTMLTextAreaElement>) {
  const { field } = useController({ control, name: "content" });
  const onSignalRef = useRef(onSignal);

  onSignalRef.current = onSignal;

  useEffect(() => {
    const textArea = document.getElementById("text");
    if (!textArea) return;

    const timer = window.setInterval(() => {
      if (document.activeElement === textArea && document.hasFocus()) {
        onSignalRef.current?.();
      }
    }, 2000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="grid flex-1 *:col-[1/2] *:row-[1/2]">
      <div
        aria-hidden
        className={textArea({
          color: "primary",
          className:
            "overflow-hidden max-h-[200px] whitespace-pre-wrap invisible pointer-events-none",
        })}
      >
        {field.value + " "}
      </div>
      <textarea
        id="text"
        {...field}
        rows={1}
        className={textArea({ color: "primary", className: "block h-full" })}
        autoComplete="off"
        {...props}
      />
    </div>
  );
}
