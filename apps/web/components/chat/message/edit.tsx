import { trpc } from "@/utils/trpc";
import { MessageType } from "@/utils/types";
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "ui/components/button";
import { textArea } from "ui/components/textarea";
import { useMessageStore } from "@/utils/stores/chat";

type EditProps = {
  message: MessageType;
};

export default function Edit({ message }: EditProps) {
  const editMutation = trpc.chat.update.useMutation({
    onSuccess: () => {
      onCancel();
    },
  });

  const { control, handleSubmit, setFocus } = useForm<{ content: string }>({
    defaultValues: {
      content: message.content,
    },
  });

  const onSave = handleSubmit((v) => {
    editMutation.mutate({
      channelId: message.channel_id,
      messageId: message.id,
      content: v.content,
    });
  });

  const onCancel = () => {
    useMessageStore.getState().setEditing(message.channel_id);
  };

  useEffect(() => {
    setFocus("content", { shouldSelect: true });
  }, [setFocus]);

  return (
    <form onSubmit={onSave}>
      <Controller
        control={control}
        name="content"
        render={({ field }) => (
          <textarea
            id="edit-message"
            placeholder="Edit message"
            autoComplete="off"
            rows={Math.min(20, field.value.split("\n").length)}
            wrap="virtual"
            className={textArea({
              color: "long",
              className: "resize-none min-h-[80px] h-auto max-h-[50vh]",
            })}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                return onSave();
              }

              if (e.key === "Escape") {
                e.preventDefault();
                return onCancel();
              }
            }}
            {...field}
          />
        )}
      />
      <label
        htmlFor="edit-message"
        className="text-xs text-accent-800 dark:text-accent-600"
      >
        Press enter to save • escape to exit
      </label>

      <div className="flex flex-row gap-3 mt-3">
        <Button color="primary" isLoading={editMutation.isLoading}>
          Save changes
        </Button>
        <Button
          type="button"
          color="secondary"
          onClick={onCancel}
          className="dark:bg-dark-700"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
