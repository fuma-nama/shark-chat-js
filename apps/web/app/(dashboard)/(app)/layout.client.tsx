"use client";
import { usePageStore } from "@/utils/stores/page";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "ui/components/toast";
import React from "react";
import { TooltipProvider } from "ui/components/tooltip";
import { Navbar } from "@/components/layout/Navbar";
import { useParams, usePathname } from "next/navigation";
import { BreadcrumbItemType } from "@/components/layout/Breadcrumbs";
import { Home, Settings, Smile, XIcon } from "lucide-react";
import { useGroup } from "@/app/(dashboard)/(app)/chat/[group]/use-group";
import { Avatar } from "ui/components/avatar";
import { groupIcon } from "shared/media/format";
import { trpc } from "@/utils/trpc";
import Link from "next/link";
import { button } from "ui/components/button";

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={100}>
      <ToastManager />
      {children}
    </TooltipProvider>
  );
}

export function Nav() {
  const pathname = usePathname();
  const params = useParams() as { group: string; channel: string };
  let breadcrumb: BreadcrumbItemType[] = [];

  if (pathname.startsWith(`/chat/${params.group}`)) {
    const settingsUrl = `/chat/${params.group}/settings`;
    return (
      <Navbar
        breadcrumb={[
          {
            id: "group",
            text: <GroupBreadcrumbItem group={params.group} />,
          },
        ]}
      >
        {pathname === settingsUrl ? (
          <Link
            href={`/chat/${params.group}`}
            aria-label="Back to Chat"
            scroll={false}
            className={button({ size: "icon", color: "ghost" })}
          >
            <XIcon className="size-5 text-muted-foreground" />
          </Link>
        ) : (
          <Link
            aria-label="Settings"
            href={settingsUrl}
            className={button({
              size: "icon",
              color: "ghost",
            })}
          >
            <Settings className="size-5 text-muted-foreground" />
          </Link>
        )}
      </Navbar>
    );
  }

  if (pathname === "/settings") {
    breadcrumb = [
      {
        id: "settings",
        text: (
          <>
            <Settings className="size-4" />
            Settings
          </>
        ),
      },
    ];
  }

  if (pathname === "/emotes") {
    breadcrumb = [
      {
        id: "emotes",
        text: (
          <>
            <Smile className="size-4" />
            Emotes
          </>
        ),
      },
    ];
  }

  if (pathname === "/") {
    breadcrumb = [
      {
        id: "Home",
        text: (
          <>
            <Home className="size-4" />
            Recent Chat
          </>
        ),
      },
    ];
  }

  if (pathname.startsWith(`/dm/${params.channel}`)) {
    breadcrumb = [
      {
        id: "dm",
        text: <DMBreadcrumbItem channelId={params.channel} />,
      },
    ];
  }

  return <Navbar breadcrumb={breadcrumb} />;
}

function GroupBreadcrumbItem({ group }: { group: string }) {
  const info = useGroup(group);

  if (!info) {
    return <div className="w-28 h-5 rounded-lg bg-muted" />;
  }

  return (
    <>
      <Avatar
        size="small"
        src={groupIcon.url([info.id], info.icon_hash)}
        alt="icon"
        fallback={info.name}
      />
      <span>{info.name}</span>
    </>
  );
}

function DMBreadcrumbItem({ channelId }: { channelId: string }) {
  const query = trpc.dm.channels.useQuery(undefined, { enabled: false });
  const channel = query.data?.find((item) => item.id === channelId);
  if (!query.data) return <div className="w-28 h-5 rounded-lg bg-muted" />;

  return (
    <>
      <Avatar
        src={channel?.user.image}
        fallback={channel?.user.name}
        size="small"
      />
      {channel?.user.name}
    </>
  );
}

function ToastManager() {
  const messages = usePageStore((s) => s.messages);

  return (
    <ToastProvider>
      <ToastViewport className="gap-4">
        {messages.map((message) => (
          <Toast
            key={message.id}
            variant={message.variant === "normal" ? "default" : "destructive"}
          >
            <div className="grid gap-1">
              <ToastTitle>{message.title}</ToastTitle>
              <ToastDescription>{message.description}</ToastDescription>
            </div>
            <ToastClose />
          </Toast>
        ))}
      </ToastViewport>
    </ToastProvider>
  );
}
