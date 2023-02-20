import React, { useRef, useEffect } from "react";

export function useBottomScroll(dependencies: React.DependencyList) {
    const scrollableRootRef = useRef<HTMLDivElement | null>(null);
    const lastScrollDistanceToBottomRef = useRef<number>();

    useEffect(() => {
        const scrollableRoot = scrollableRootRef.current;
        const lastScrollDistanceToBottom =
            lastScrollDistanceToBottomRef.current ?? 0;
        if (scrollableRoot) {
            scrollableRoot.scrollTop =
                scrollableRoot.scrollHeight - lastScrollDistanceToBottom;
        }
    }, [dependencies]);

    const handleRootScroll = React.useCallback(() => {
        const rootNode = scrollableRootRef.current;
        if (rootNode) {
            const scrollDistanceToBottom =
                rootNode.scrollHeight - rootNode.scrollTop;
            lastScrollDistanceToBottomRef.current = scrollDistanceToBottom;
        }
    }, []);

    return { scrollableRootRef, handleRootScroll };
}
