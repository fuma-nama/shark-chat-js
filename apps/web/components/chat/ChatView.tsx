import { usePageStore } from "@/utils/stores/page";
import dynamic from "next/dynamic";
import { ReactNode } from "react";
import useInfiniteScroll, {
  UseInfiniteScrollHookArgs,
} from "react-infinite-scroll-hook";

const UserProfileModal = dynamic(() => import("../modal/UserProfileModal"));

export function ChatViewProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = usePageStore((s) => [s.modal, s.setModal]);

  return (
    <>
      {modal?.type === "user-profile" && (
        <UserProfileModal
          userId={modal.user_id}
          open
          onOpenChange={() => setModal(undefined)}
        />
      )}
      {children}
    </>
  );
}

export function ChatViewport({ children }: { children: ReactNode }) {
  return (
    <div
      id="scroll"
      className="relative flex flex-col h-dvh overflow-y-scroll overflow-x-hidden [overflow-anchor:none]"
    >
      {children}
    </div>
  );
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
