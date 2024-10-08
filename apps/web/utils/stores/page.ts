import { create } from "zustand";

type Modal = UserModal | CreateGroupModal | JoinGroupModal | BoardingModal;

type UserModal = {
  type: "user";
  user_id: string;
};

type CreateGroupModal = {
  type: "create-group";
};

type JoinGroupModal = {
  type: "join-group";
};

type BoardingModal = {
  type: "on-boarding";
};

type ToastMessage = {
  id: number;
  title?: string;
  description: string;
  variant?: "red" | "normal";
};

type PageStore = {
  isSidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  messages: ToastMessage[];
  addMessage: (message: Omit<ToastMessage, "id">) => void;
  removeMessage: (id: number) => void;
  modal?: Modal;
  setModal: (type: Modal | undefined) => void;
};

export const usePageStore = create<PageStore>((set) => ({
  isSidebarOpen: false,
  setSidebarOpen: (v: boolean) => set({ isSidebarOpen: v }),
  messages: [],
  addMessage(info) {
    const message: ToastMessage = {
      id: Date.now(),
      variant: "red",
      ...info,
    };

    set((prev) => ({
      messages: [...prev.messages, message],
    }));
  },
  removeMessage(id) {
    set((c) => ({
      messages: c.messages.filter((v) => v.id !== id),
    }));
  },
  setModal: (type) => set({ modal: type }),
}));

export function showToast(error: Omit<ToastMessage, "id">) {
  return usePageStore.getState().addMessage(error);
}
