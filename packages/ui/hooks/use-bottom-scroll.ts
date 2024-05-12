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

function getElement(): HTMLElement | null {
  return document.getElementById("scroll");
}

export function useBottomScroll(): UseBottomScroll {
  const virtualScrollTopRef = useRef<number>(0);

  const setRealScrollTop = useCallback(() => {
    const element = getElement();
    if (!element) return;
    element.scrollTop = virtualToReal(element, virtualScrollTopRef.current);
  }, []);

  const resetScroll = useCallback(() => {
    virtualScrollTopRef.current = 0;

    setRealScrollTop();
  }, [setRealScrollTop]);

  useEffect(() => {
    const element = getElement();
    if (!element) return;

    const handleRootScroll = () => {
      virtualScrollTopRef.current = realToVirtual(element, element.scrollTop);
    };

    element.addEventListener("scroll", handleRootScroll);
    return () => {
      element.removeEventListener("scroll", handleRootScroll);
    };
  }, []);

  const updateScrollPosition = useCallback(() => {
    setRealScrollTop();
  }, [setRealScrollTop]);

  return { resetScroll, updateScrollPosition };
}
