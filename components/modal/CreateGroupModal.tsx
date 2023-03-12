import React, { ReactNode, useState } from "react";
import { Dialog } from "../system/dialog";
import dynamic from "next/dynamic";
import { Spinner } from "../system/spinner";

const Content = dynamic(async () => import("./dynamic/create-group"), {
    loading: () => (
        <div className="flex items-center justify-center py-10">
            <Spinner size="large" />
        </div>
    ),
});

export type DialogProps = {
    children: ReactNode;
};

export function CreateGroupModal({ children }: DialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog
            title="Create Group"
            description="Give your chat group a beautiful name and icon"
            open={isOpen}
            onOpenChange={setIsOpen}
            trigger={children}
        >
            <Content onClose={() => setIsOpen(false)} />
        </Dialog>
    );
}
