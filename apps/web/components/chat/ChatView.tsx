import { usePageStore } from "@/utils/stores/page";
import dynamic from "next/dynamic";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
} from "react";
import useInfiniteScroll, {
  UseInfiniteScrollHookArgs,
} from "react-infinite-scroll-hook";

const UserProfileModal = dynamic(() => import("../modal/UserProfileModal"));

export interface ChatViewContext {
  deleteMessage: boolean;
}

export const ChatContext = createContext<ChatViewContext | undefined>(
  undefined,
);

export function ChatViewport({
  children,
  ...props
}: ChatViewContext & { children: ReactNode }) {
  const [modal, setModal] = usePageStore((s) => [s.modal, s.setModal]);
  useBottomScroll();

  return (
    <div
      id="scroll"
      className="absolute inset-0 top-[52px] flex flex-col overflow-y-scroll overflow-x-hidden [overflow-anchor:none] overscroll-none"
    >
      {modal && (
        <UserProfileModal
          userId={modal.user_id}
          open={modal.type === "user-profile"}
          onOpenChange={() => setModal(undefined)}
        />
      )}
      <div id="scroll-inner" className="flex flex-col flex-1">
        <ChatContext.Provider value={props}>{children}</ChatContext.Provider>
      </div>
    </div>
  );
}

export function useViewContext() {
  return useContext(ChatContext)!;
}

export function getViewportScroll(): HTMLDivElement | null {
  return document.getElementById("scroll") as HTMLDivElement;
}

export function getViewportInner(): HTMLDivElement | null {
  return document.getElementById("scroll-inner") as HTMLDivElement;
}

export function useChatView(props: UseInfiniteScrollHookArgs) {
  const [sentryRef] = useInfiniteScroll({
    delayInMs: 100,
    rootMargin: "20px",
    ...props,
  });

  return {
    sentryRef,
  };
}

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

export function useBottomScroll(): UseBottomScroll {
  const virtualScrollTopRef = useRef(0);

  const setRealScrollTop = useCallback(() => {
    const element = getViewportScroll();
    if (!element) return;
    element.scrollTop = virtualToReal(element, virtualScrollTopRef.current);
  }, []);

  const resetScroll = useCallback(() => {
    virtualScrollTopRef.current = 0;

    setRealScrollTop();
  }, [setRealScrollTop]);

  useLayoutEffect(() => {
    const viewport = getViewportScroll();
    const inner = getViewportInner();

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
