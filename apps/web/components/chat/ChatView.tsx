import { usePageStore } from "@/utils/stores/page";
import dynamic from "next/dynamic";
import {
    ReactNode,
    RefObject,
    createContext,
    useContext,
    useEffect,
} from "react";
import useInfiniteScroll, {
    UseInfiniteScrollHookArgs,
} from "react-infinite-scroll-hook";
import { useViewScrollController } from "ui/hooks/use-bottom-scroll";

type ContextType = {
    viewRef: RefObject<HTMLDivElement>;
    scrollToBottom: ReturnType<
        typeof useViewScrollController
    >["scrollToBottom"];
};

const ViewContext = createContext<ContextType | undefined>(undefined);

const UserProfileModal = dynamic(() => import("../modal/UserProfileModal"));

export function ChatViewProvider({
    value,
    children,
}: {
    value: ContextType;
    children: ReactNode;
}) {
    const [modal, setModal] = usePageStore((s) => [s.modal, s.setModal]);

    return (
        <ViewContext.Provider value={value}>
            {modal?.type === "user-profile" && (
                <UserProfileModal
                    userId={modal.user_id}
                    open
                    onOpenChange={() => setModal(undefined)}
                />
            )}
            {children}
        </ViewContext.Provider>
    );
}

export function useChatView(props: UseInfiniteScrollHookArgs) {
    const ctx = useContext(ViewContext)!!;
    const [sentryRef, { rootRef }] = useInfiniteScroll({
        delayInMs: 100,
        rootMargin: "20px",
        ...props,
    });

    useEffect(() => {
        rootRef(ctx.viewRef.current);
    }, [rootRef, ctx.viewRef]);

    return {
        ...ctx,
        sentryRef,
    };
}

export function UnreadSeparator() {
    return (
        <div
            className="flex flex-row gap-2 items-center"
            aria-label="separator"
        >
            <div className="h-[1px] flex-1 bg-red-500 dark:bg-red-400" />
            <p className="text-red-500 dark:text-red-400 text-sm mx-auto">
                New Message
            </p>
            <div className="h-[1px] flex-1 bg-red-500 dark:bg-red-400" />
        </div>
    );
}
