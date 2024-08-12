"use client";
import { Avatar } from "ui/components/avatar";
import { Button } from "ui/components/button";
import { trpc } from "@/utils/trpc";
import { groupIcon } from "shared/media/format";
import Link from "next/link";
import { Spinner } from "ui/components/spinner";
import { BoxIcon } from "lucide-react";
import { useCallback, useEffect } from "react";
import { DirectMessageContextMenu } from "@/components/menu/DirectMessageMenu";
import { tv } from "tailwind-variants";
import { getTimeString } from "ui/utils/time";
import type { GroupWithNotifications } from "server/routers/group/group";
import type { DMChannel } from "server/routers/dm";
import { useRouter } from "next/navigation";
import { usePageStore } from "@/utils/stores/page";
import BoardingModal from "@/components/modal/BoardingModal";

const card = tv({
  base: [
    "relative rounded-xl bg-card border p-4 flex flex-row gap-3 transition-colors duration-100 hover:bg-accent",
    "shadow-lg shadow-brand-500/10 dark:shadow-none",
  ],
});

function Modals() {
  const router = useRouter();
  const [setModal] = usePageStore((s) => [s.setModal]);

  useEffect(() => {
    const params = new URLSearchParams(document.location.search);

    if (params.get("modal") === "new") {
      router.replace("/");
      setModal({ type: "on-boarding" });
    }
  }, [router, setModal]);

  return <BoardingModal />;
}

export default function Page() {
  return (
    <>
      <Modals />
      <RecentChat />
    </>
  );
}

function RecentChat() {
  const setModal = usePageStore((s) => s.setModal);
  const dmQuery = trpc.dm.channels.useQuery(undefined, {
    enabled: false,
  });
  const groups = trpc.group.all.useQuery(undefined, {
    enabled: false,
  });

  const onRetry = useCallback(() => {
    void dmQuery.refetch();
    void groups.refetch();
  }, [dmQuery, groups]);

  return (
    <main className="flex flex-col gap-6 p-4">
      <div className="flex flex-row gap-2 md:hidden">
        <Button
          color="primary"
          onClick={() => setModal({ type: "create-group" })}
        >
          Create Group
        </Button>
        <Button onClick={() => setModal({ type: "join-group" })}>
          Join Group
        </Button>
      </div>
      {dmQuery.isLoading || groups.isLoading ? (
        <div className="mx-auto mt-12">
          <Spinner size="large" />
        </div>
      ) : dmQuery.isError || groups.isError ? (
        <div className="mx-auto mt-12 flex flex-col gap-3">
          <h2 className="font-semibold text-lg text-foreground">
            Failed to fetch info
          </h2>
          <Button color="danger" size="medium" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          {dmQuery.data && dmQuery.data.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {dmQuery.data.map((chat) => (
                <ChatItem key={chat.id} chat={chat} />
              ))}
            </div>
          ) : null}
          <h1 className="text-lg font-semibold">Chat Groups</h1>
          {groups.data.length === 0 ? (
            <Placeholder />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {groups.data.map((group) => (
                <GroupItem key={group.id} group={group} />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}

function GroupItem({ group }: { group: GroupWithNotifications }) {
  const lastRead = group.last_read
    ? getTimeString(new Date(group.last_read))
    : undefined;

  return (
    <Link href={`/chat/${group.id}`} className={card()}>
      <Avatar
        src={groupIcon.url([group.id], group.icon_hash)}
        fallback={group.name}
      />
      <div className="w-0 flex-1">
        <p className="font-medium text-sm truncate">{group.name}</p>
        <p className="text-sm text-muted-foreground truncate">
          {group.last_message?.content ?? lastRead}
        </p>
      </div>

      {group.unread_messages > 0 && (
        <p className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">
          {group.unread_messages}
        </p>
      )}
    </Link>
  );
}

function ChatItem({ chat }: { chat: DMChannel }) {
  const user = chat.user;
  const lastRead = chat.last_read
    ? getTimeString(new Date(chat.last_read))
    : undefined;

  return (
    <DirectMessageContextMenu channelId={chat.id}>
      <Link href={`/dm/${chat.id}`} className={card()}>
        <Avatar src={user.image} fallback={user.name} />
        <div className="flex-1 w-0">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <p className="text-sm text-muted-foreground truncate">
            {chat.last_message?.content ?? lastRead}
          </p>
        </div>
        {chat.unread_messages > 0 && (
          <p className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">
            {chat.unread_messages}
          </p>
        )}
      </Link>
    </DirectMessageContextMenu>
  );
}

function Placeholder() {
  return (
    <div className="flex flex-col items-center justify-center my-auto">
      <BoxIcon className="w-20 h-20 text-brand-500 dark:text-brand-400 max-md:hidden" />
      <p className="font-medium text-base text-foreground">Nothing here</p>
      <p className="text-muted-foreground text-sm">
        Try to find someone chat with you?
      </p>
    </div>
  );
}
