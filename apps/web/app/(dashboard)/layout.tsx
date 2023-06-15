import { TrpcProvider } from "@/utils/trpc/app-router-provider";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return <TrpcProvider>{children}</TrpcProvider>;
}
