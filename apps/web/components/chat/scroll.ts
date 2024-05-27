import { RefCallback, useLayoutEffect, useRef, useState } from "react";
import { useCallbackRef } from "@/utils/hooks/use-callback-ref";
import {
  getViewportInner,
  getViewportScroll,
} from "@/components/chat/ChatView";

export interface UseBottomScroll {
  info: MeasureMap;
  measure: RefCallback<HTMLElement>;
}

type MeasureMap = Map<
  string,
  { element: HTMLElement; isIntersecting: boolean; height: number }
>;

function virtualToReal(element: Element, virtual: number): number {
  return element.scrollHeight - virtual - element.clientHeight;
}

function realToVirtual(element: Element, real: number): number {
  return element.scrollHeight - real - element.clientHeight;
}

export function useBottomScroll(): UseBottomScroll {
  const virtualScrollTopRef = useRef(0);
  const [info, setInfo] = useState<MeasureMap>(() => new Map());
  const intersectionObserverRef = useRef<IntersectionObserver>();
  const pendingRef = useRef<HTMLElement[]>([]);

  const setRealScrollTop = useCallbackRef(() => {
    const element = getViewportScroll();
    if (!element) return;
    element.scrollTop = virtualToReal(element, virtualScrollTopRef.current);
  });

  const resetScroll = useCallbackRef(() => {
    virtualScrollTopRef.current = 0;

    setRealScrollTop();
  });

  const measure: RefCallback<HTMLElement> = useCallbackRef((element) => {
    if (!element) return;
    const observer = intersectionObserverRef.current;

    if (observer) {
      const key = element.getAttribute("data-key");
      if (key && info.has(key)) return;

      observer.observe(element);
    } else {
      pendingRef.current.push(element);
    }
  });

  useLayoutEffect(() => {
    const viewport = getViewportScroll();
    const check = [viewport, getViewportInner()];

    if (!viewport) return;

    const handleRootScroll = () => {
      virtualScrollTopRef.current = realToVirtual(viewport, viewport.scrollTop);
    };

    const observer = new ResizeObserver(() => {
      setRealScrollTop();
    });

    // reset before adding listener
    resetScroll();

    intersectionObserverRef.current = new IntersectionObserver(
      (e) => {
        setInfo((prev) => {
          e.forEach((item) => {
            const key = item.target.getAttribute("data-key");
            if (key) {
              prev.set(key, {
                element: item.target as HTMLElement,
                isIntersecting: item.isIntersecting,
                height: item.boundingClientRect.height,
              });
            } else
              console.warn(
                "Element doesn't have a data-key attribute",
                item.target,
              );
          });

          return new Map(prev);
        });
      },
      {
        root: viewport,
        rootMargin: "100px 0px",
      },
    );
    viewport.addEventListener("scroll", handleRootScroll);
    check.forEach((element) => {
      if (element) observer.observe(element);
    });
    pendingRef.current.forEach((element) => {
      intersectionObserverRef.current!.observe(element);
    });
    return () => {
      observer.disconnect();
      intersectionObserverRef.current?.disconnect();
      viewport.removeEventListener("scroll", handleRootScroll);
    };
  }, [resetScroll, setRealScrollTop]);

  return { info, measure };
}
