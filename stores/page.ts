import { create } from "zustand";

export type PageStore = {
    isSidebarOpen: boolean;
    setSidebarOpen: (v: boolean) => void;
    messages: ToastMessage[];
    addError: (error: ToastError) => void;
    removeMessage: (id: number) => void;
};

export type ToastError = Omit<ToastMessage, "id">;
export type ToastMessage = {
    id: number;
    title: string;
    description: string;
    variant?: "red" | "normal";
};

export const usePageStore = create<PageStore>((set) => ({
    isSidebarOpen: false,
    setSidebarOpen: (v: boolean) => set({ isSidebarOpen: v }),
    messages: [],
    addError: (error) => {
        const message: ToastMessage = {
            ...error,
            id: Date.now(),
            variant: "red",
        };

        set((prev) => ({
            messages: [...prev.messages, message],
        }));
    },
    removeMessage: (id) => {
        set((c) => ({
            messages: c.messages.filter((v) => v.id !== id),
        }));
    },
}));

export function showErrorToast(error: ToastError) {
    return usePageStore.getState().addError(error);
}
