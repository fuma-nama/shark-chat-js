import { useRef, useCallback, useEffect } from "react";

export function useViewScrollController() {
    const lastScrollDistanceToBottomRef = useRef<number>();

    const resetScroll = useCallback(() => {
        lastScrollDistanceToBottomRef.current = undefined;

        if (document.scrollingElement) {
            document.scrollingElement.scrollTop =
                document.scrollingElement.scrollHeight;
        }
    }, []);

    useEffect(() => {
        const handleRootScroll = () => {
            const root = document.scrollingElement;
            if (!root) return;

            const scrollDistanceToBottom = root.scrollHeight - root.scrollTop;
            lastScrollDistanceToBottomRef.current = scrollDistanceToBottom;
        };

        document.addEventListener("scroll", handleRootScroll);

        return () => {
            document.removeEventListener("scroll", handleRootScroll);
        };
    }, []);

    const updateScrollPosition = useCallback(() => {
        const root = document.scrollingElement;
        const lastScrollDistanceToBottom =
            lastScrollDistanceToBottomRef.current ?? 0;

        if (root == null) return;

        root.scrollTop = root.scrollHeight - lastScrollDistanceToBottom;
    }, []);

    return { resetScroll, updateScrollPosition };
}
