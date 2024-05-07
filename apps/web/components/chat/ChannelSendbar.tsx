import { uploadAttachment } from "@/utils/hooks/mutations/upload-attachment";
import { useMessageStore } from "@/utils/stores/chat";
import { RouterInput, trpc } from "@/utils/trpc";
import { XIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { SendData, Sendbar } from "./Sendbar";
import { channels } from "@/utils/ably/client";
import { useSession } from "next-auth/react";
import { useTypingStatus, TypingIndicator } from "./TypingIndicator";
import { useCallback } from "react";
import { button } from "ui/components/button";

type SendMutationInput = Omit<RouterInput["chat"]["send"], "attachment"> & {
  attachment: SendData["attachment"];
};

export function ChannelSendbar({ channelId }: { channelId: string }) {
  const utils = trpc.useUtils();
  const [info, update, add, addError] = useMessageStore((s) => [
    s.sendbar[channelId],
    s.updateSendbar,
    s.addSending,
    s.errorSending,
  ]);

  const typeMutation = utils.client.chat.type;
  const sendMutation = useMutation(
    async ({ attachment, ...data }: SendMutationInput) => {
      await utils.client.chat.send.mutate({
        ...data,
        attachment:
          attachment != null
            ? await uploadAttachment(utils, attachment)
            : undefined,
      });
    },
    {
      onError(error, { nonce, channelId }) {
        if (nonce == null) return;

        addError(
          channelId,
          nonce,
          error instanceof TRPCClientError
            ? error.message
            : "Something went wrong",
        );
      },
    },
  );

  const onEscape = useCallback(() => {
    update(channelId, {
      reply_to: undefined,
    });
  }, [channelId, update]);

  const onSend = (data: SendData) => {
    sendMutation.mutate({
      ...data,
      channelId: channelId,
      reply: info?.reply_to?.id ?? undefined,
      nonce: add(channelId, data, info?.reply_to).nonce,
    });

    onEscape();
  };

  return (
    <Sendbar
      onSend={onSend}
      onType={() => typeMutation.mutate({ channelId: channelId })}
      onEscape={onEscape}
    >
      {info?.reply_to != null && (
        <div className="flex flex-row pt-2 px-2 text-sm text-muted-foreground">
          <p className="flex-1">
            Replying to{" "}
            <span className="font-medium text-foreground">
              {info.reply_to.author?.name ?? "Unknown User"}
            </span>
          </p>
          <button
            aria-label="delete"
            className={button({ color: "ghost", size: "icon" })}
            onClick={() => update(channelId, { reply_to: undefined })}
          >
            <XIcon className="size-4" />
          </button>
        </div>
      )}

      <TypingUsers channelId={channelId} />
    </Sendbar>
  );
}

function TypingUsers({ channelId }: { channelId: string }) {
  const { status, data: session } = useSession();
  const { typing, add } = useTypingStatus();

  channels.chat.typing.useChannel(
    [channelId],
    { enabled: status === "authenticated" },
    (message) => {
      if (message.data.user.id === session?.user.id) return;

      add(message.data.user);
    },
  );

  return <TypingIndicator typing={typing} />;
}
