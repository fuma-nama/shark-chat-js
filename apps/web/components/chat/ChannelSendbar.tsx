import { uploadAttachment } from "@/utils/media/upload-attachment";
import { useMessageStore } from "@/utils/stores/chat";
import { RouterInput, trpc } from "@/utils/trpc";
import { Cross1Icon } from "@radix-ui/react-icons";
import { useMutation } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { SendData, Sendbar } from "./Sendbar";
import { channels } from "@/utils/ably/client";
import { useSession } from "next-auth/react";
import { useTypingStatus, TypingIndicator } from "./TypingIndicator";

type SendMutationInput = Omit<RouterInput["chat"]["send"], "attachment"> & {
    attachment: SendData["attachment"];
};

export function ChannelSendbar({ channelId }: { channelId: string }) {
    const utils = trpc.useContext();
    const [info, update, add, addError] = useMessageStore((s) => [
        s.sendbar[channelId],
        s.updateSendbar,
        s.addSending,
        s.errorSending,
    ]);

    const typeMutation = trpc.useContext().client.chat.type;
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
                        : "Something went wrong"
                );
            },
        }
    );

    const onSend = (data: SendData) => {
        sendMutation.mutate({
            ...data,
            channelId: channelId,
            reply: info?.reply_to?.id ?? undefined,
            nonce: add(channelId, data).nonce,
        });

        update(channelId, {
            reply_to: undefined,
        });
    };

    return (
        <Sendbar
            onSend={onSend}
            onType={() => typeMutation.mutate({ channelId: channelId })}
        >
            {info?.reply_to != null && (
                <div className="flex flex-row">
                    <p className="text-muted-foreground text-sm flex-1">
                        Replying to{" "}
                        <b>{info.reply_to.author?.name ?? "Unknown User"}</b>
                    </p>
                    <button
                        className="text-muted-foreground"
                        onClick={() =>
                            update(channelId, { reply_to: undefined })
                        }
                    >
                        <Cross1Icon />
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
        }
    );

    return <TypingIndicator typing={typing} />;
}
