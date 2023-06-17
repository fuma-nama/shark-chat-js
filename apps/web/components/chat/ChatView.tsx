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
    viewRef: RefObject<Element | null>;
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
