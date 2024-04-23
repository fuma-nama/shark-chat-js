import * as Base from "@radix-ui/react-alert-dialog";
import { Button } from "./button";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

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
  return (
    <Base.Root {...props}>
      <Base.Trigger asChild>{children}</Base.Trigger>
      <Base.Portal>
        <Base.Overlay className="fixed inset-0 z-20 bg-black/50 backdrop-blur-md radix-state-open:animate-in radix-state-open:fade-in radix-state-closed:animate-out radix-state-closed:fade-out" />
        <Base.Content
          className={twMerge(
            "fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[95vw] max-w-md rounded-lg p-4 bg-popover md:w-full m-auto z-50 animate-dialog-in radix-state-closed:animate-dialog-out focus:outline-none"
          )}
        >
          <Base.Title className="text-lg font-medium">{title}</Base.Title>
          <Base.Description className="mt-2 text-sm text-muted-foreground">
            {description}
          </Base.Description>
          <div className="flex flex-row gap-3 justify-end mt-6">
            <Base.Cancel asChild>
              <Button color="secondary">Cancel</Button>
            </Base.Cancel>
            <Base.Action asChild>{action}</Base.Action>
          </div>
        </Base.Content>
      </Base.Portal>
    </Base.Root>
  );
}
