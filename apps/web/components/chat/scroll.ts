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

    // reset before adding listener
    resetScroll();

    const intersectionObserver = new IntersectionObserver(
      (e) => {
        setInfo((prev) => {
          e.forEach((item) => {
            const key = item.target.getAttribute("data-key");
            if (!key) return;

            prev.set(key, {
              element: item.target as HTMLElement,
              isIntersecting: item.isIntersecting,
              height: item.boundingClientRect.height,
            });
          });

          return new Map(prev);
        });
      },
      {
        root: viewport,
        rootMargin: "100px 0px",
      },
    );

    const observer = new ResizeObserver(() => {
      setRealScrollTop();
    });
    intersectionObserverRef.current = intersectionObserver;
    check.forEach((element) => {
      if (element) observer.observe(element);
    });
    pendingRef.current.forEach((element) => {
      intersectionObserver.observe(element);
    });

    // Enable scroll after certain time to prevent shifting
    // because browsers may call `onScroll` before `ResizeObserver`
    setTimeout(() => {
      resetScroll();
      viewport.addEventListener("scroll", handleRootScroll);
    }, 1000);
    return () => {
      observer.disconnect();
      intersectionObserver.disconnect();
      viewport.removeEventListener("scroll", handleRootScroll);
    };
  }, [resetScroll, setRealScrollTop]);

  return { info, measure };
}
