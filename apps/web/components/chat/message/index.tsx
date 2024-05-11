import { MessageType } from "@/utils/types";
import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";

import * as Item from "./atom";
import * as ContextMenu from "ui/components/context-menu";
import { AttachmentItem } from "../AttachmentItem";
import { useMessageStore } from "@/utils/stores/chat";
import { useParams } from "next/navigation";
import { CopyIcon, EditIcon, ReplyIcon, TrashIcon } from "lucide-react";
import Edit from "./edit";
import { Reference } from "./reference";
import { Embed } from "./embed";
import { DropdownMenuContent, DropdownMenuItem } from "ui/components/dropdown";

export function ChatMessageItem({ message }: { message: MessageType }) {
  const editing = useMessageStore(
    (s) => s.editing[message.channel_id]?.messageId === message.id,
  );
  const embedOnly =
    message.embeds != null &&
    message.embeds.length === 1 &&
    !message.embeds[0].title &&
    !message.embeds[0].description &&
    message.embeds[0].url === message.content;

  return (
    <Item.Root>
      <ContextMenu.Trigger disabled={editing} asChild>
        <Item.Content user={message.author} timestamp={message.timestamp}>
          {editing ? (
            <Edit message={message} />
          ) : (
            <>
              {message.reply_id != null && (
                <Reference
                  user={message.reply_user}
                  content={message.reply_message?.content}
                />
              )}
              {!embedOnly && <Item.Text>{message.content}</Item.Text>}
              {message.attachment != null && (
                <AttachmentItem attachment={message.attachment} />
              )}
              {message.embeds?.map((v, i) => <Embed key={i} embed={v} />)}
              <Item.Menu />
              <Menu message={message} />
            </>
          )}
        </Item.Content>
      </ContextMenu.Trigger>
    </Item.Root>
  );
}

interface Item {
  id: string;
  icon: React.ReactNode;
  onSelect: () => void;
  color?: "danger";
  text: string;
}

function Menu({ message }: { message: MessageType }) {
  const { status, data } = useSession();
  const { group } = useParams() as { group?: string };

  const query = trpc.group.info.useQuery(
    { groupId: typeof group === "string" ? Number(group) : NaN },
    {
      enabled: status === "authenticated" && typeof group === "string",
      staleTime: Infinity,
    },
  );

  const deleteMutation = trpc.chat.delete.useMutation();

  const isAuthor =
    status === "authenticated" && message.author_id === data.user.id;

  const isGroup = typeof group === "string";

  const isAdmin =
    query.status === "success" &&
    status === "authenticated" &&
    query.data.owner_id === data.user.id;

  const onClose = (e: Event) => {
    if (
      useMessageStore.getState().editing[message.channel_id]?.messageId !==
      message.id
    ) {
      document.getElementById("text")?.focus();
      e.preventDefault();
    }
  };

  const items: Item[] = [
    {
      id: "reply",
      icon: <ReplyIcon className="size-4" />,
      onSelect: () =>
        useMessageStore
          .getState()
          .updateSendbar(message.channel_id, { reply_to: message }),
      text: "Reply",
    },
    {
      id: "copy",
      icon: <CopyIcon className="size-4" />,
      onSelect: () => navigator.clipboard.writeText(message.content),
      text: "Copy",
    },
  ];

  if (isAuthor) {
    items.push({
      id: "edit",
      icon: <EditIcon className="size-4" />,
      onSelect: () =>
        useMessageStore.getState().setEditing(message.channel_id, message.id),
      text: "Edit",
    });
  }
  if ((isGroup && isAdmin) || isAuthor) {
    items.push({
      id: "delete",
      color: "danger",
      icon: <TrashIcon className="size-4" />,
      onSelect: () => {
        deleteMutation.mutate({
          messageId: message.id,
        });
      },
      text: "Delete",
    });
  }

  return (
    <>
      <DropdownMenuContent onCloseAutoFocus={onClose}>
        {items.map(({ id, ...item }) => (
          <DropdownMenuItem key={id} {...item}>
            {item.icon}
            {item.text}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
      <ContextMenu.Content onCloseAutoFocus={onClose}>
        {items.map(({ id, ...item }) => (
          <ContextMenu.Item key={id} {...item}>
            {item.text}
          </ContextMenu.Item>
        ))}
      </ContextMenu.Content>
    </>
  );
}
