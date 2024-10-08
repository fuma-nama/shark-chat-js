import { usePageStore } from "@/utils/stores/page";
import dynamic from "next/dynamic";
import { createContext, ReactNode, useContext } from "react";

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

  return (
    <div
      id="scroll"
      className="absolute inset-0 flex flex-col overflow-y-scroll overflow-x-hidden [overflow-anchor:none] overscroll-none"
    >
      <UserProfileModal
        open={modal?.type === "user"}
        userId={modal?.type === "user" ? modal.user_id : ""}
        onOpenChange={() => setModal(undefined)}
      />
      <div id="scroll-inner" className="flex flex-col flex-1 pb-4">
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
