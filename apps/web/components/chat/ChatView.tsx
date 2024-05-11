import { usePageStore } from "@/utils/stores/page";
import dynamic from "next/dynamic";
import { createContext, ReactNode, useContext } from "react";
import useInfiniteScroll, {
  UseInfiniteScrollHookArgs,
} from "react-infinite-scroll-hook";
import { useBottomScroll, UseBottomScroll } from "ui/hooks/use-bottom-scroll";

const ViewContext = createContext<UseBottomScroll | undefined>(undefined);

const UserProfileModal = dynamic(() => import("../modal/UserProfileModal"));

export function ChatViewProvider({ children }: { children: ReactNode }) {
  const controller = useBottomScroll();
  const [modal, setModal] = usePageStore((s) => [s.modal, s.setModal]);

  return (
    <ViewContext.Provider value={controller}>
      {modal?.type === "user-profile" && (
        <UserProfileModal
          userId={modal.user_id}
          open
          onOpenChange={() => setModal(undefined)}
        />
      )}
      {children}
    </ViewContext.Provider>
  );
}

export function useChatViewContext(): UseBottomScroll {
  return useContext(ViewContext)!!;
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
