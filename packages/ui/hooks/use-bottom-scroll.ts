import { useRef, useCallback, useEffect } from "react";

export function useViewScrollController() {
    const rootRef = useRef<Element | null>(null);
    const lastScrollDistanceToBottomRef = useRef<number>();

    const handleRootScroll = useCallback(() => {
        const rootNode = rootRef.current;

        if (rootNode) {
            const scrollDistanceToBottom =
                rootNode.scrollHeight - rootNode.scrollTop;
            lastScrollDistanceToBottomRef.current = scrollDistanceToBottom;
        }
    }, []);

    useEffect(() => {
        rootRef.current = document.scrollingElement;
        document.addEventListener("scroll", handleRootScroll);

        return () => {
            document.removeEventListener("scroll", handleRootScroll);
        };
    }, [handleRootScroll]);

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

    return { rootRef, scrollToBottom };
}
