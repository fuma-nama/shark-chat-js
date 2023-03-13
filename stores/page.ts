import { create } from "zustand";

export type PageStore = {
    isSidebarOpen: boolean;
    setSidebarOpen: (v: boolean) => void;
    errors: ToastError[];
    removeError: (id: string, index: number) => void;
};

export type ToastError = {
    id: string;
    title: string;
    description: string;
};

export const usePageStore = create<PageStore>((set) => ({
    isSidebarOpen: false,
    setSidebarOpen: (v: boolean) => set({ isSidebarOpen: v }),
    errors: [
        {
            id: "test",
            title: "Failed to fetch",
            description: 'Unexpected token at index 0: "json"',
        },
    ],
    removeError: (id, index) => {
        set((c) => ({
            errors: c.errors.filter((v, i) => i !== index && v.id !== id),
        }));
    },
}));
