import React, { useRef, useCallback } from "react";

export function useBottomScroll() {
    const scrollableRootRef = useRef<HTMLDivElement | null>(null);
    const lastScrollDistanceToBottomRef = useRef<number>();

    const scrollToBottom = useCallback(() => {
        const scrollableRoot = scrollableRootRef.current;
        const lastScrollDistanceToBottom =
            lastScrollDistanceToBottomRef.current ?? 0;

        if (scrollableRoot) {
            scrollableRoot.scrollTop =
                scrollableRoot.scrollHeight - lastScrollDistanceToBottom;
        }
    }, []);

    const handleRootScroll = React.useCallback(() => {
        const rootNode = scrollableRootRef.current;
        if (rootNode) {
            const scrollDistanceToBottom =
                rootNode.scrollHeight - rootNode.scrollTop;
            lastScrollDistanceToBottomRef.current = scrollDistanceToBottom;
        }
    }, []);

    return { scrollableRootRef, handleRootScroll, scrollToBottom };
}
