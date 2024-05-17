import { useProfile } from "@/utils/hooks/use-profile";
import * as MessageItem from "./atom";
import { useMemo } from "react";
import { MessagePlaceholder } from "@/utils/stores/chat";
import { UploadingAttachmentItem } from "../AttachmentItem";
import { Reference } from "@/components/chat/message/reference";

export function LocalMessageItem({
  message,
  chainStart,
  chainEnd,
}: {
  message: MessagePlaceholder;
  chainStart: boolean;
  chainEnd: boolean;
}) {
  const timestamp = useMemo(() => new Date(Date.now()), []);
  const { profile } = useProfile();

  return (
    <MessageItem.Root>
      <MessageItem.Content
        user={profile}
        timestamp={timestamp}
        className="opacity-50"
        chainStart={chainStart}
        chainEnd={chainEnd}
      >
        {message.reply ? (
          <Reference
            id={message.reply.id}
            user={message.reply.author}
            content={message.reply.content}
          />
        ) : null}
        <MessageItem.Text>{message.data.content}</MessageItem.Text>
        {message.data.attachment != null && (
          <UploadingAttachmentItem file={message.data.attachment} />
        )}
        {message.error != null && (
          <p className="text-red-400">{message.error}</p>
        )}
      </MessageItem.Content>
    </MessageItem.Root>
  );
}
