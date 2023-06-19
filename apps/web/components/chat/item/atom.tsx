import { ReactNode } from "react";
import { Avatar } from "ui/components/avatar";

import * as ContextMenu from "ui/components/context-menu";

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
    const date = new Date(timestamp).toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
        hourCycle: "h24",
    });

    const setModal = usePageStore((s) => s.setModal);

    const onOpenProfile = () => {
        setModal({ type: "user-profile", user_id: author.id });
    };

    return (
        <ContextMenu.Trigger
            className={cn(
                "p-3 rounded-xl bg-light-50 flex flex-row items-start gap-2",
                "dark:bg-dark-800",
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
                <div className="flex flex-row items-center">
                    <p
                        className="font-semibold cursor-pointer"
                        onClick={onOpenProfile}
                    >
                        {author.name}
                    </p>

                    <p className="text-xs sm:text-xs text-muted-foreground ml-auto sm:ml-2">
                        {date}
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
        <div className="prose prose-message break-words overflow-hidden">
            <Markdown value={children} gfm breaks openLinksInNewTab />
        </div>
    );
}
