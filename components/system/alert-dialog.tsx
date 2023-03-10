import * as Base from "@radix-ui/react-alert-dialog";
import { dialog } from "./dialog";
import { Button } from "./button";
import { ReactNode } from "react";

export type AlertDialogProps = {
    title: string;
    description: string;
    action: ReactNode;
    children: ReactNode;
} & Base.AlertDialogProps;

export function AlertDialog({
    title,
    description,
    action,
    children,
    ...props
}: AlertDialogProps) {
    const styles = dialog({});

    return (
        <Base.Root {...props}>
            <Base.Trigger asChild>{children}</Base.Trigger>
            <Base.Portal>
                <Base.Overlay className={styles.overlay()}>
                    <Base.Content className={styles.content()}>
                        <Base.Title className={styles.title()}>
                            {title}
                        </Base.Title>
                        <Base.Description className={styles.description()}>
                            {description}
                        </Base.Description>
                        <div className="flex flex-row gap-3 justify-end mt-6">
                            <Base.Cancel asChild>
                                <Button color="secondary">Cancel</Button>
                            </Base.Cancel>
                            <Base.Action asChild>{action}</Base.Action>
                        </div>
                    </Base.Content>
                </Base.Overlay>
            </Base.Portal>
        </Base.Root>
    );
}
