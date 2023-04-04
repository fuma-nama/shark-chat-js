import React, { useRef, useCallback } from "react";

export function useViewScrollController() {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const lastScrollDistanceToBottomRef = useRef<number>();

    const handleRootScroll = React.useCallback(() => {
        const rootNode = rootRef.current;
        if (rootNode) {
            const scrollDistanceToBottom =
                rootNode.scrollHeight - rootNode.scrollTop;
            lastScrollDistanceToBottomRef.current = scrollDistanceToBottom;
        }
    }, []);

    const scrollToBottom = useCallback(() => {
        const scrollableRoot = rootRef.current;
        const lastScrollDistanceToBottom =
            lastScrollDistanceToBottomRef.current ?? 0;

        if (scrollableRoot) {
            scrollableRoot.scrollTop =
                scrollableRoot.scrollHeight - lastScrollDistanceToBottom;
        }
    }, []);

    return { rootRef, handleRootScroll, scrollToBottom };
}
