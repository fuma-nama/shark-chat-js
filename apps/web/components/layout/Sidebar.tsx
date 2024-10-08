"use client";
import { usePageStore } from "@/utils/stores/page";
import { useProfile } from "@/utils/hooks/use-profile";
import {
  ChevronRightIcon,
  HomeIcon,
  Plus,
  SmileIcon,
  XIcon,
} from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Avatar } from "ui/components/avatar";
import { trpc } from "@/utils/trpc";
import { cn } from "ui/utils/cn";
import { groupIcon } from "shared/media/format";
import { DirectMessageContextMenu } from "../menu/DirectMessageMenu";
import {
  type AnchorHTMLAttributes,
  forwardRef,
  type ReactNode,
  useCallback,
  useEffect,
} from "react";
import { Spinner } from "ui/components/spinner";
import { useMessageStore } from "@/utils/stores/chat";
import { button } from "ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "ui/components/dropdown";

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setOpen] = usePageStore((v) => [
    v.isSidebarOpen,
    v.setSidebarOpen,
  ]);
  const onClose = useCallback(() => setOpen(false), [setOpen]);

  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed size-full bg-black/30 z-50 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={clsx(
          "sticky top-0 flex flex-col p-4 pb-0 gap-1 bg-card border-r overflow-x-hidden overflow-y-auto md:h-dvh",
          "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:w-full max-md:max-w-[16rem] max-md:z-50 max-md:pt-10 max-md:transition-transform max-md:duration-300",
          !isOpen && "max-md:-translate-x-full",
        )}
      >
        <button
          className={button({
            className: "absolute top-2 left-2 md:hidden",
            color: "ghost",
            size: "icon",
          })}
          onClick={onClose}
        >
          <XIcon className="size-5 text-muted-foreground" />
        </button>
        <LinkItem
          name="Home"
          route="/"
          icon={<HomeIcon className="size-3" fill="currentColor" />}
        />
        <LinkItem
          name="Emotes"
          route="/emotes"
          icon={<SmileIcon className="size-3" />}
        />
        <Nav />
        <BottomCard />
      </aside>
    </>
  );
}

function Nav() {
  const params = useParams() as { group?: string; channel?: string };
  const query = trpc.group.all.useQuery(undefined, { enabled: false });
  const dm = trpc.dm.channels.useQuery(undefined, { enabled: false });
  const [setModal] = usePageStore((s) => [s.setModal]);

  if (!query.data || !dm.data)
    return (
      <div className="flex items-center justify-center p-2 h-20 bg-accent rounded-xl mt-4">
        <Spinner />
      </div>
    );

  return (
    <>
      <p className="text-sm font-medium mt-2">Groups</p>
      <div className="flex flex-col">
        {query.data.map((group) => (
          <ChatItem
            key={group.id}
            href={`/chat/${group.id}`}
            channelId={group.channel_id}
            description={group.last_message?.content}
            active={params.group === group.id.toString()}
            image={groupIcon.url([group.id], group.icon_hash)}
            notifications={group.unread_messages}
          >
            {group.name}
          </ChatItem>
        ))}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="New Chat Group"
          className={button({ className: "-mx-2" })}
        >
          <Plus className="size-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
          <DropdownMenuItem onClick={() => setModal({ type: "create-group" })}>
            Create
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setModal({ type: "join-group" })}>
            Join with Invite
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <p className="text-sm mt-2 mb-2 font-medium">Users</p>
      {dm.data.length === 0 ? (
        <div className="p-3 text-center bg-accent rounded-xl text-sm text-muted-foreground -mx-2">
          no direct messages
        </div>
      ) : (
        <div className="flex flex-col">
          {dm.data.map((item) => (
            <DirectMessageContextMenu key={item.id} channelId={item.id}>
              <ChatItem
                href={`/dm/${item.id}`}
                channelId={item.id}
                description={item.last_message?.content}
                active={params.channel === item.id}
                image={item.user.image}
                notifications={item.unread_messages}
              >
                {item.user.name}
              </ChatItem>
            </DirectMessageContextMenu>
          ))}
        </div>
      )}
    </>
  );
}

function LinkItem({
  icon,
  name,
  route,
}: {
  name: string;
  route: string;
  icon: ReactNode;
}) {
  const active = route === usePathname();

  return (
    <Link
      href={route}
      className={cn(
        "flex flex-row gap-2 text-muted-foreground items-center px-3 -mx-3 py-2 rounded-xl",
        active
          ? "bg-accent text-accent-foreground"
          : "hover:bg-accent/50 transition-colors",
      )}
    >
      <div
        className={cn(
          "p-2 rounded-full bg-primary text-primary-foreground",
          !active && "opacity-50",
        )}
      >
        {icon}
      </div>
      <p className="text-sm font-medium">{name}</p>
    </Link>
  );
}

interface ChatItemProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  active: boolean;

  href: string;
  channelId: string;
  description?: string;
  image: string | null;
  children: string;
  notifications: number;
}

const ChatItem = forwardRef<HTMLAnchorElement, ChatItemProps>(
  ({ active, notifications, channelId, image, description, ...props }, ref) => {
    const lastMessage = useMessageStore((s) => s.messages[channelId]?.at(-1));

    return (
      <Link
        ref={ref}
        scroll={false}
        {...props}
        className={cn(
          "flex flex-row items-center gap-2 px-3 -mx-2 py-2 rounded-xl text-sm transition-colors select-none",
          active
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent/50",
          props.className,
        )}
      >
        <Avatar
          src={image}
          fallback={props.children}
          size="small"
          rounded="full"
        />
        <div className="w-0 flex-1">
          <p className="font-medium truncate">{props.children}</p>
          <p className="text-muted-foreground text-xs truncate">
            {lastMessage?.content ?? description}
          </p>
        </div>
        {notifications > 0 && (
          <div className="text-primary-foreground bg-primary text-xs rounded-full px-1.5 py-0.5 ml-auto">
            {notifications}
          </div>
        )}
      </Link>
    );
  },
);

ChatItem.displayName = "ChatItem";

function BottomCard() {
  const { status, profile } = useProfile();
  if (status !== "authenticated") return null;

  return (
    <div className="sticky bottom-0 bg-card mt-auto -mx-2 pb-2">
      <Link
        href="/settings"
        className="p-2 rounded-xl flex flex-row items-center group cursor-pointer transition-colors hover:bg-accent"
      >
        <div className="flex flex-col flex-shrink-0 max-h-fit mr-3">
          <Avatar src={profile.image} fallback={profile.name} size="2sm" />
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          <p className="font-medium text-sm">{profile.name}</p>
          <p className="text-muted-foreground text-xs">View Profile</p>
        </div>
        <ChevronRightIcon className="size-4 my-auto text-muted-foreground" />
      </Link>
    </div>
  );
}
