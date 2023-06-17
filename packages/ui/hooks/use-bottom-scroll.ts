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

            if (type === "force") {
                scrollableRoot.scrollTop = scrollableRoot.scrollHeight;
            } else {
                scrollableRoot.scrollTop =
                    scrollableRoot.scrollHeight - lastScrollDistanceToBottom;
            }

            lastScrollDistanceToBottomRef.current =
                scrollableRoot.scrollHeight - scrollableRoot.scrollTop;
        },
        []
    );

    return { rootRef, scrollToBottom };
}
