import { forwardRef, Fragment, ReactNode } from "react";
import { Avatar } from "ui/components/avatar";

import * as ContextMenu from "ui/components/context-menu";
import { getTimeString } from "ui/utils/time";
import { MessageType } from "@/utils/types";
import { cn } from "ui/utils/cn";
import { usePageStore } from "@/utils/stores/page";
import Markdown from "marked-react";
import { DropdownMenu, DropdownMenuTrigger } from "ui/components/dropdown";
import { MoreHorizontalIcon } from "lucide-react";
import { button } from "ui/components/button";

type ContentProps = {
  user: MessageType["author"];
  timestamp: string | Date | number;
  className?: string;
  children: ReactNode;
};

export const Content = forwardRef<HTMLDivElement, ContentProps>(
  ({ user, timestamp, children, ...props }, ref) => {
    const author = user ?? {
      id: "",
      image: null,
      name: "Deleted User",
    };

    const date = new Date(timestamp);

    const onOpenProfile = () => {
      usePageStore
        .getState()
        .setModal({ type: "user-profile", user_id: author.id });
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative group p-3 rounded-xl flex flex-row items-start gap-2 bg-card text-[15px]",
          props.className,
        )}
      >
        <Avatar
          src={author.image}
          fallback={author.name}
          className="cursor-pointer"
          onClick={onOpenProfile}
        />
        <div className="flex-1 flex flex-col w-0">
          <div className="flex flex-row items-center mb-1">
            <p className="font-medium cursor-pointer" onClick={onOpenProfile}>
              {author.name}
            </p>

            <p className="text-xs text-muted-foreground ml-2 mr-auto">
              {getTimeString(date)}
            </p>
          </div>
          {children}
        </div>
      </div>
    );
  },
);

Content.displayName = "MessageContent";

export function Menu() {
  return (
    <DropdownMenuTrigger
      aria-label="Open Menu"
      className={button({
        size: "icon",
        className:
          "absolute -top-2 right-4 opacity-0 group-hover:opacity-100 radix-state-open:opacity-100",
      })}
    >
      <MoreHorizontalIcon className="size-4" />
    </DropdownMenuTrigger>
  );
}

type RootProps = {
  children: ReactNode;
};

export function Root({ children }: RootProps) {
  return (
    <ContextMenu.Root>
      <DropdownMenu>{children}</DropdownMenu>
    </ContextMenu.Root>
  );
}

export function Text({ children }: { children: string }) {
  return (
    <div className="prose prose-message text-[15px] break-words overflow-hidden">
      <Markdown
        value={children}
        gfm
        breaks
        openLinksInNewTab
        renderer={{
          image: (src, alt) => (
            <Fragment key={src}>{`![${alt}](${src})`}</Fragment>
          ),
        }}
      />
    </div>
  );
}
