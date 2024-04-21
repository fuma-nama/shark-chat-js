import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { button } from "./button";

export type SimpleDialogProps = Pick<
  DialogPrimitive.DialogProps,
  "defaultOpen" | "onOpenChange" | "open"
> & {
  title: string;
  description?: string;
  trigger?: ReactNode;
  children: ReactNode;
  contentProps?: DialogPrimitive.DialogContentProps;
};

export function SimpleDialog({
  title,
  description,
  trigger,
  children,
  contentProps,
  ...props
}: SimpleDialogProps) {
  return (
    <Dialog {...props}>
      {trigger != null && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent {...contentProps}>
        <DialogPrimitive.Title className="text-lg font-semibold mb-2">
          {title}
        </DialogPrimitive.Title>
        {description && (
          <DialogPrimitive.Description className="text-sm text-muted-foreground mb-4">
            {description}
          </DialogPrimitive.Description>
        )}
        {children}
        <DialogClose
          aria-label="Close Dialog"
          className={button({
            color: "ghost",
            size: "icon",
            className: "absolute top-3.5 right-3.5",
          })}
        >
          <XIcon className="h-4 w-4" />
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.DialogTrigger;
const DialogClose = DialogPrimitive.DialogClose;

type DialogProps = DialogPrimitive.DialogProps;
type DialogContentProps = DialogPrimitive.DialogContentProps;

function DialogContent(props: DialogPrimitive.DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-20 bg-black/50 backdrop-blur-md radix-state-open:animate-in radix-state-open:fade-in radix-state-closed:animate-out radix-state-closed:fade-out" />
      <DialogPrimitive.Content
        {...props}
        className={twMerge(
          "fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[95vw] max-w-md rounded-lg p-4 bg-popover md:w-full m-auto z-50 animate-dialog-in radix-state-closed:animate-dialog-out focus:outline-none",
          props.className
        )}
      >
        {props.children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export {
  type DialogProps,
  type DialogContentProps,
  Dialog,
  DialogContent,
  DialogClose,
  DialogTrigger,
};
