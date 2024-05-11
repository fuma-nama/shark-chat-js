import { useCallback, useEffect, useRef } from "react";

export interface UseBottomScroll {
  resetScroll: () => void;
  updateScrollPosition: () => void;
}

function virtualToReal(element: Element, virtual: number): number {
  return element.scrollHeight - virtual - element.clientHeight;
}

function realToVirtual(element: Element, real: number): number {
  return element.scrollHeight - real - element.clientHeight;
}

export function useBottomScroll(): UseBottomScroll {
  const virtualScrollTopRef = useRef<number>(0);

  const setRealScrollTop = useCallback(() => {
    if (!document.scrollingElement) return;
    document.scrollingElement.scrollTop = virtualToReal(
      document.scrollingElement,
      virtualScrollTopRef.current,
    );
  }, []);

  const resetScroll = useCallback(() => {
    virtualScrollTopRef.current = 0;

    setRealScrollTop();
  }, [setRealScrollTop]);

  useEffect(() => {
    const handleRootScroll = () => {
      const root = document.scrollingElement;
      if (!root) return;

      virtualScrollTopRef.current = realToVirtual(root, root.scrollTop);
    };

    document.addEventListener("scroll", handleRootScroll);

    return () => {
      document.removeEventListener("scroll", handleRootScroll);
    };
  }, []);

  const updateScrollPosition = useCallback(() => {
    setRealScrollTop();
  }, [setRealScrollTop]);

  return { resetScroll, updateScrollPosition };
}
