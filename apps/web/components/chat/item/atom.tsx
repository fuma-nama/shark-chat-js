import { ReactNode, useMemo } from "react";
import { Avatar } from "ui/components/avatar";

import * as ContextMenu from "ui/components/context-menu";

import { MessageType } from "@/utils/types";
import { linkIt, urlRegex } from "react-linkify-it";
import { UserProfileModal } from "../../modal/UserProfileModal";
import { DialogTrigger } from "ui/components/dialog";
import { cn } from "ui/utils/cn";

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

    return (
        <ContextMenu.Trigger
            className={cn(
                "p-3 rounded-xl bg-light-50 flex flex-row items-start gap-2",
                "dark:bg-dark-800",
                props.className
            )}
        >
            <UserProfileModal userId={author.id}>
                <DialogTrigger>
                    <Avatar src={author.image} fallback={author.name} />
                </DialogTrigger>
                <div className="flex-1 flex flex-col w-0">
                    <div className="flex flex-row items-center">
                        <DialogTrigger asChild>
                            <p className="font-semibold cursor-pointer">
                                {author.name}
                            </p>
                        </DialogTrigger>

                        <p className="text-xs sm:text-xs text-muted-foreground ml-auto sm:ml-2">
                            {date}
                        </p>
                    </div>

                    {children}
                </div>
            </UserProfileModal>
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
    const nodes = useMemo(() => {
        return linkIt(
            children,
            (url, key) => (
                <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-500 dark:text-brand-200"
                >
                    {url}
                </a>
            ),
            urlRegex
        );
    }, [children]);

    return (
        <p className="[overflow-wrap:anywhere] [white-space:break-spaces]">
            {nodes}
        </p>
    );
}
