import { usePageStore } from "@/utils/stores/page";
import dynamic from "next/dynamic";
import { ReactNode } from "react";
import useInfiniteScroll, {
  UseInfiniteScrollHookArgs,
} from "react-infinite-scroll-hook";
import { useBottomScroll } from "ui/hooks/use-bottom-scroll";

const UserProfileModal = dynamic(() => import("../modal/UserProfileModal"));

export function ChatViewport({ children }: { children: ReactNode }) {
  const [modal, setModal] = usePageStore((s) => [s.modal, s.setModal]);
  useBottomScroll({
    viewport: getViewportScroll,
    inner: getViewportInner,
  });

  return (
    <div
      id="scroll"
      className="absolute inset-0 top-[52px] flex flex-col overflow-y-scroll overflow-x-hidden [overflow-anchor:none] overscroll-none"
    >
      <div id="scroll-inner" className="flex flex-col flex-1">
        {modal && (
          <UserProfileModal
            userId={modal.user_id}
            open={modal.type === "user-profile"}
            onOpenChange={() => setModal(undefined)}
          />
        )}
        {children}
      </div>
    </div>
  );
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
