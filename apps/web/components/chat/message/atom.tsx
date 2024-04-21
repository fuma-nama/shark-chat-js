import { Fragment, ReactNode } from "react";
import { Avatar } from "ui/components/avatar";

import * as ContextMenu from "ui/components/context-menu";
import { getTimeString } from "ui/utils/time";
import { MessageType } from "@/utils/types";
import { cn } from "ui/utils/cn";
import { usePageStore } from "@/utils/stores/page";
import Markdown from "marked-react";

type ContentProps = {
  user: MessageType["author"];
  timestamp: string | Date | number;
  className?: string;
  children: ReactNode;
};

export function Content({ user, timestamp, children, ...props }: ContentProps) {
  const author = user ?? {
    id: "",
    image: null,
    name: "Deleted User",
  };

  const date = new Date(timestamp);
  const setModal = usePageStore((s) => s.setModal);

  const onOpenProfile = () => {
    setModal({ type: "user-profile", user_id: author.id });
  };

  return (
    <ContextMenu.Trigger
      className={cn(
        "p-3 rounded-xl flex flex-row items-start gap-2 bg-card text-[15px]",
        props.className
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

          <p className="text-xs text-muted-foreground ml-auto sm:ml-2">
            {getTimeString(date)}
          </p>
        </div>

        {children}
      </div>
    </ContextMenu.Trigger>
  );
}

type RootProps = {
  children: ReactNode;
};

export function Root({ children }: RootProps) {
  return <ContextMenu.Root>{children}</ContextMenu.Root>;
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
