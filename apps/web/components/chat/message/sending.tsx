import { useProfile } from "@/utils/hooks/use-profile";
import * as MessageItem from "./atom";
import { useMemo } from "react";
import { MessagePlaceholder } from "@/utils/stores/chat";
import { UploadingAttachmentItem } from "../AttachmentItem";
import { Reference } from "@/components/chat/message/reference";

export function LocalMessageItem({ item }: { item: MessagePlaceholder }) {
  const timestamp = useMemo(() => new Date(Date.now()), []);
  const { profile } = useProfile();

  return (
    <MessageItem.Root>
      <MessageItem.Content
        user={profile}
        timestamp={timestamp}
        className="opacity-50"
      >
        {item.reply ? <Reference data={item.reply} /> : null}
        <MessageItem.Text>{item.data.content}</MessageItem.Text>
        {item.data.attachment != null && (
          <UploadingAttachmentItem file={item.data.attachment} />
        )}
        {item.error != null && <p className="text-red-400">{item.error}</p>}
      </MessageItem.Content>
    </MessageItem.Root>
  );
}
