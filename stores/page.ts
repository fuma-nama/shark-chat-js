import { create } from "zustand";

export type PageStore = {
    isSidebarOpen: boolean;
    setSidebarOpen: (v: boolean) => void;
    errors: ToastError[];
    addError: (error: ToastError) => void;
    removeError: (index: number) => void;
};

export type ToastError = {
    title: string;
    description: string;
};

export const usePageStore = create<PageStore>((set) => ({
    isSidebarOpen: false,
    setSidebarOpen: (v: boolean) => set({ isSidebarOpen: v }),
    errors: [],
    addError: (error) => set((prev) => ({ errors: [...prev.errors, error] })),
    removeError: (index) => {
        set((c) => ({
            errors: c.errors.filter((_, i) => i !== index),
        }));
    },
}));

export function showErrorToast(error: ToastError) {
    return usePageStore.getState().addError(error);
}
