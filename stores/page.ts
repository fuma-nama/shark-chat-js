import { create } from "zustand";

export type PageStore = {
    isSidebarOpen: boolean;
    setSidebarOpen: (v: boolean) => void;
};
export const usePageStore = create<PageStore>((set) => ({
    isSidebarOpen: false,
    setSidebarOpen: (v: boolean) => set({ isSidebarOpen: v }),
}));
