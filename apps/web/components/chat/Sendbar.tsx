import {
  BrainIcon,
  ChevronDownIcon,
  PlusIcon,
  SendIcon,
  TrashIcon,
  UploadIcon,
} from "lucide-react";
import { textArea } from "ui/components/textarea";
import React, {
  HTMLAttributes,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { button, IconButton } from "ui/components/button";
import { contentSchema } from "shared/schema/chat";
import { Control, useController, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dynamic from "next/dynamic";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "ui/components/dropdown";

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

export function Sendbar({
  onSend: send,
  onType,
  onEscape,
  children,
}: {
  onSend: (data: SendData) => void;
  onType: () => void;
  onEscape: () => void;
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
    <div className="sticky z-20 bottom-0 bg-background w-full sm:px-4 sm:pb-4">
      <RollbackButton />
      <div className="flex flex-col gap-3 pt-2 pb-7 px-3.5 bg-muted/50 sm:rounded-3xl sm:bg-secondary sm:p-2">
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
        <div className="flex flex-row items-center gap-2">
          <DropdownMenu>
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
          <TextArea
            control={control}
            onType={onType}
            onPaste={(e) => {
              if (e.clipboardData.files.length > 0) {
                e.preventDefault();
                setValue("attachment", e.clipboardData.files[0], {
                  shouldDirty: true,
                });
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                void onSend();
                e.preventDefault();
              }

              if (e.key === "Escape") {
                onEscape();
                e.preventDefault();
              }
            }}
          />
          <IconButton
            disabled={!formState.isValid}
            color="primary"
            className="size-8 rounded-full p-0 disabled:hidden sm:m-0.5"
            onClick={onSend}
          >
            <SendIcon className="size-4 -translate-x-px translate-y-px" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

function RollbackButton() {
  const [canRollback, setCanRollback] = useState(false);

  useEffect(() => {
    const listener = () => {
      const node = document.scrollingElement!!;
      const diff = node.scrollHeight - (node.scrollTop + node.clientHeight);

      setCanRollback(diff > 500);
    };

    window.addEventListener("scroll", listener);
    return () => {
      window.removeEventListener("scroll", listener);
    };
  }, []);

  const onClick = () => {
    const node = document.scrollingElement;

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
  onType,
  ...props
}: {
  control: Control<SendData>;
  onType: () => void;
} & HTMLAttributes<HTMLTextAreaElement>) {
  const { field } = useController({ control, name: "content" });
  const lastType = useRef<Date>();

  return (
    <div className="grid flex-1 *:col-[1/2] *:row-[1/2]">
      <div
        aria-hidden
        className={textArea({
          color: "primary",
          className:
            "overflow-hidden max-h-[200px] whitespace-pre-wrap invisible",
        })}
      >
        {field.value + " "}
      </div>
      <textarea
        id="text"
        {...field}
        rows={1}
        onChange={(e) => {
          field.onChange(e);

          if (canSendSignal(lastType.current, 2)) {
            onType();
            lastType.current = new Date(Date.now());
          }
        }}
        className={textArea({ color: "primary", className: "block h-full" })}
        autoComplete="off"
        {...props}
      />
    </div>
  );
}

function canSendSignal(lastType: Date | undefined, intervalSeconds: number) {
  if (lastType == null) return true;

  const min = new Date(lastType);
  min.setSeconds(min.getSeconds() + intervalSeconds);

  return new Date(Date.now()) > min;
}
