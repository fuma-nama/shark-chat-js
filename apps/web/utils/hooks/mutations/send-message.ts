import { useMutation } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { RouterInput } from "server/trpc";
import { SendData } from "@/components/chat/Sendbar";
import { type RouterUtils, trpc } from "@/utils/trpc";
import { useMessageStore } from "@/utils/stores/chat";
import { upload } from "@/utils/hooks/mutations/upload";
import { UploadAttachment } from "shared/schema/chat";

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

const forced: Record<string, "raw" | "image"> = {
  "application/pdf": "raw",
};

async function uploadAttachment(
  utils: RouterUtils,
  file: File,
): Promise<UploadAttachment> {
  const idx = file.name.lastIndexOf(".");
  const filename = idx === -1 ? file.name : file.name.slice(0, idx);

  const res = await upload(
    () =>
      utils.client.upload.signAttachment.query({
        filename,
      }),
    file,
    {
      resource_type: forced[file.type] ?? "auto",
    },
  );

  return {
    name: file.name,
    url: res.secure_url,
    type: res.resource_type,
    bytes: res.bytes,
    width: res.width!,
    height: res.height!,
  };
}
