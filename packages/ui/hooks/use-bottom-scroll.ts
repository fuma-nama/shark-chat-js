import {
    useRef,
    useCallback,
    useEffect,
    useLayoutEffect,
    DependencyList,
} from "react";

export function useViewScrollController(dependency: DependencyList) {
    const rootRef = useRef<Element | null>(null);
    const lastScrollDistanceToBottomRef = useRef<number>();

    useLayoutEffect(() => {
        rootRef.current = document.scrollingElement;
        lastScrollDistanceToBottomRef.current = undefined;

        if (document.scrollingElement) {
            document.scrollingElement.scrollTop =
                document.scrollingElement.scrollHeight;
        }

        console.log("reset");
    }, [dependency]);

    const handleRootScroll = useCallback(() => {
        const rootNode = rootRef.current;

        if (rootNode) {
            const scrollDistanceToBottom =
                rootNode.scrollHeight - rootNode.scrollTop;
            lastScrollDistanceToBottomRef.current = scrollDistanceToBottom;
        }
    }, [rootRef.current]);

    useEffect(() => {
        console.log("listeners");
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
                console.log("scroll", scrollableRoot.scrollHeight);
            } else {
                scrollableRoot.scrollTop =
                    scrollableRoot.scrollHeight - lastScrollDistanceToBottom;
                console.log(
                    "scroll",
                    scrollableRoot.scrollHeight - lastScrollDistanceToBottom
                );
            }
        },
        []
    );

    return { rootRef, scrollToBottom };
}
