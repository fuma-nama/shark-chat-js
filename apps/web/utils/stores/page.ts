import { create } from "zustand";

type ModalType = {
    type: "user-profile";
    user_id: string;
};
type ToastError = { title: string; description: string };
type ToastMessage = {
    id: number;
    title: string;
    description: string;
    variant?: "red" | "normal";
};

type PageStore = {
    isSidebarOpen: boolean;
    setSidebarOpen: (v: boolean) => void;
    messages: ToastMessage[];
    addError: (error: ToastError) => void;
    removeMessage: (id: number) => void;
    modal?: ModalType;
    setModal: (type: ModalType | undefined) => void;
};

export const usePageStore = create<PageStore>((set) => ({
    isSidebarOpen: false,
    setSidebarOpen: (v: boolean) => set({ isSidebarOpen: v }),
    messages: [],
    addError(error) {
        const message: ToastMessage = {
            ...error,
            id: Date.now(),
            variant: "red",
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

export function showErrorToast(error: ToastError) {
    return usePageStore.getState().addError(error);
}
