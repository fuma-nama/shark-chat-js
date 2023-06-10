import { trpc } from "@/utils/trpc";
import { SimpleDialog, DialogClose } from "ui/components/dialog";
import { textArea } from "ui/components/textarea";
import { Button, button } from "ui/components/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

export default function GenerateTextModal({
    setValue,
    onFocus,
    open,
    setOpen,
}: {
    setValue: (v: string) => void;
    onFocus: () => void;
    open: boolean;
    setOpen: (v: boolean) => void;
}) {
    return (
        <SimpleDialog
            title="Generate Text"
            description="Write better message without thinking"
            open={open}
            onOpenChange={setOpen}
            contentProps={{
                onCloseAutoFocus: (e) => {
                    onFocus();
                    e.preventDefault();
                },
            }}
        >
            <Content setValue={setValue} />
        </SimpleDialog>
    );
}

const schema = z.object({
    text: z.string().trim().min(1),
});

function Content({ setValue }: { setValue: (s: string) => void }) {
    const mutation = trpc.chat.generateText.useMutation();
    const { register, handleSubmit } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            text: "",
        },
    });

    const result = mutation.status === "success" ? mutation.data.text : "";
    const isGenerated = result.length !== 0;

    const onGenerate = handleSubmit(({ text }) => {
        mutation.mutate({ text });
    });

    return (
        <div className="mt-3 flex flex-col gap-3">
            <textarea
                {...register("text", { minLength: 1 })}
                className={textArea({
                    color: "long",
                    className: "resize-none",
                })}
                placeholder="Do sharks hunt people?"
            />
            {mutation.isError && (
                <p className="text-sm text-destructive-foreground">
                    {mutation.error.message}
                </p>
            )}
            <p
                className={textArea({
                    color: "long",
                    className:
                        "min-h-[50px] max-h-[200px] overflow-y-auto whitespace-pre-wrap",
                })}
            >
                {isGenerated ? (
                    result
                ) : (
                    <span className="text-accent-600 dark:text-accent-800">
                        Result
                    </span>
                )}
            </p>
            {isGenerated ? (
                <div className="flex flex-row gap-3 justify-end">
                    <DialogClose
                        className={button({ color: "primary" })}
                        onClick={() => setValue(result)}
                    >
                        Accept Result
                    </DialogClose>
                    <button
                        className={button({ color: "secondary" })}
                        onClick={() => mutation.reset()}
                    >
                        Again
                    </button>
                </div>
            ) : (
                <Button
                    color="primary"
                    isLoading={mutation.isLoading}
                    onClick={onGenerate}
                >
                    Generate
                </Button>
            )}
        </div>
    );
}
