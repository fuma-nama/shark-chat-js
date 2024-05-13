import { useMutation } from "@tanstack/react-query";
import { uploadAttachment } from "@/utils/hooks/mutations/upload-attachment";
import { TRPCClientError } from "@trpc/client";
import { RouterInput } from "server/trpc";
import { SendData } from "@/components/chat/Sendbar";
import { trpc } from "@/utils/trpc";
import { useMessageStore } from "@/utils/stores/chat";

type SendMutationInput = Omit<RouterInput["chat"]["send"], "attachment"> & {
  attachment: SendData["attachment"];
};

export function useSendMessageMutation() {
  const utils = trpc.useUtils();

  return useMutation(
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

        useMessageStore
          .getState()
          .errorSending(
            channelId,
            nonce,
            error instanceof TRPCClientError
              ? error.message
              : "Something went wrong",
          );
      },
    },
  );
}
