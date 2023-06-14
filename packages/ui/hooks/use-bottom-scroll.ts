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

    const scrollToBottom = useCallback(
        (type: "last_distance" | "force" = "last_distance") => {
            const scrollableRoot = rootRef.current;
            const lastScrollDistanceToBottom =
                lastScrollDistanceToBottomRef.current ?? 0;

            if (scrollableRoot == null) return;
            scrollableRoot.scrollTop =
                type === "last_distance"
                    ? scrollableRoot.scrollHeight - lastScrollDistanceToBottom
                    : scrollableRoot.scrollHeight;
        },
        []
    );

    return { rootRef, handleRootScroll, scrollToBottom };
}
