import { useCallback, useEffect, useRef } from "react";

export interface UseBottomScroll {
  resetScroll: () => void;
  setRealScrollTop: () => void;
}

function virtualToReal(element: Element, virtual: number): number {
  return element.scrollHeight - virtual - element.clientHeight;
}

function realToVirtual(element: Element, real: number): number {
  return element.scrollHeight - real - element.clientHeight;
}

export function useBottomScroll(options: {
  viewport: () => HTMLElement | null;
  inner: () => HTMLElement | null;
}): UseBottomScroll {
  const optionsRef = useRef(options);
  const virtualScrollTopRef = useRef(0);
  optionsRef.current = options;

  const setRealScrollTop = useCallback(() => {
    const element = optionsRef.current.viewport();
    if (!element) return;
    element.scrollTop = virtualToReal(element, virtualScrollTopRef.current);
  }, []);

  const resetScroll = useCallback(() => {
    virtualScrollTopRef.current = 0;

    setRealScrollTop();
  }, [setRealScrollTop]);

  useEffect(() => {
    const viewport = optionsRef.current.viewport();
    const inner = optionsRef.current.inner();

    if (!viewport) return;

    const handleRootScroll = () => {
      virtualScrollTopRef.current = realToVirtual(viewport, viewport.scrollTop);
    };

    const observer = new ResizeObserver(() => {
      setRealScrollTop();
    });

    // reset before adding listener
    resetScroll();

    viewport.addEventListener("scroll", handleRootScroll);
    if (inner) observer.observe(inner);
    return () => {
      observer.disconnect();
      viewport.removeEventListener("scroll", handleRootScroll);
    };
  }, [resetScroll, setRealScrollTop]);

  return { resetScroll, setRealScrollTop };
}
