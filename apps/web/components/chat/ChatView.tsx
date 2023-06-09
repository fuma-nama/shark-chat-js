import { useContext, useEffect } from "react";
import useInfiniteScroll, {
    UseInfiniteScrollHookArgs,
} from "react-infinite-scroll-hook";
import { ViewContext } from "../layout/app";

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
