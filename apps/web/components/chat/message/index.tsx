import { MessageType } from "@/utils/types";
import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { RefObject, useRef, useState } from "react";

import * as Item from "./atom";
import * as ContextMenu from "ui/components/context-menu";
import { AttachmentItem } from "../AttachmentItem";
import { useMessageStore } from "@/utils/stores/chat";
import { useRouter } from "next/router";
import { CopyIcon, EditIcon, ReplyIcon, TrashIcon } from "lucide-react";
import Edit from "./edit";
import { Reference } from "./reference";
import { Embed } from "./embed";
import { DropdownMenuContent, DropdownMenuItem } from "ui/components/dropdown";

export function ChatMessageItem({ message }: { message: MessageType }) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const embedOnly =
    message.embeds != null &&
    message.embeds.length === 1 &&
    !message.embeds[0].title &&
    !message.embeds[0].description &&
    message.embeds[0].url === message.content;

  return (
    <Item.Root>
      <Item.Content user={message.author} timestamp={message.timestamp}>
        {message.reply_id != null && <Reference data={message} />}
        {editing ? (
          <Edit
            inputRef={inputRef}
            message={message}
            onCancel={() => setEditing(false)}
          />
        ) : (
          !embedOnly && <Item.Text>{message.content}</Item.Text>
        )}
        {message.attachment != null && (
          <AttachmentItem attachment={message.attachment} />
        )}
        {message.embeds?.map((v, i) => <Embed key={i} embed={v} />)}
      </Item.Content>
      <Menu
        inputRef={inputRef}
        message={message}
        editing={editing}
        setEditing={setEditing}
      />
    </Item.Root>
  );
}

function Menu({
  message,
  editing,
  setEditing,
  inputRef,
}: {
  message: MessageType;
  editing: boolean;
  setEditing: (v: boolean) => void;
  inputRef: RefObject<HTMLTextAreaElement>;
}) {
  const { status, data } = useSession();
  const { group } = useRouter().query;

  const query = trpc.group.info.useQuery(
    { groupId: typeof group === "string" ? Number(group) : NaN },
    {
      enabled: status === "authenticated" && typeof group === "string",
      staleTime: Infinity,
    },
  );

  const deleteMutation = trpc.chat.delete.useMutation();

  const updateSendbar = useMessageStore((s) => s.updateSendbar);

  const isAuthor =
    status === "authenticated" && message.author_id === data.user.id;

  const isGroup = typeof group === "string";

  const isAdmin =
    query.status === "success" &&
    status === "authenticated" &&
    query.data.owner_id === data.user.id;

  const onDelete = () => {
    deleteMutation.mutate({
      messageId: message.id,
    });
  };

  const onClose = (e: Event) => {
    if (editing && inputRef.current) {
      const edit = inputRef.current;
      edit.focus();
      edit.selectionStart = edit.selectionEnd = edit.value.length;
    } else {
      document.getElementById("text")?.focus();
    }

    e.preventDefault();
  };

  interface Item {
    id: string;
    icon: React.ReactNode;
    onSelect: () => void;
    color?: "danger";
    text: string;
  }
  const items: Item[] = [
    {
      id: "reply",
      icon: <ReplyIcon className="size-4" />,
      onSelect: () => updateSendbar(message.channel_id, { reply_to: message }),
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
      onSelect: () => setEditing(!editing),
      text: editing ? "Close Edit" : "Edit",
    });
  }
  if ((isGroup && isAdmin) || isAuthor) {
    items.push({
      id: "delete",
      color: "danger",
      icon: <TrashIcon className="size-4" />,
      onSelect: onDelete,
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
