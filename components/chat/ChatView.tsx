import { useBottomScroll } from "@/utils/use-bottom-scroll";
import {
    createContext,
    ReactNode,
    RefObject,
    useContext,
    useEffect,
} from "react";
import useInfiniteScroll, {
    UseInfiniteScrollHookArgs,
} from "react-infinite-scroll-hook";

const ViewContext = createContext<
    | {
          viewRef: RefObject<HTMLDivElement>;
          scrollToBottom: () => void;
      }
    | undefined
>(undefined);

export function ChatViewLayout({ children }: { children: ReactNode }) {
    const { handleRootScroll, scrollableRootRef, scrollToBottom } =
        useBottomScroll();

    return (
        <ViewContext.Provider
            value={{ scrollToBottom, viewRef: scrollableRootRef }}
        >
            <div
                className="flex flex-col overflow-y-auto"
                ref={scrollableRootRef}
                onScroll={handleRootScroll}
            >
                {children}
            </div>
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
