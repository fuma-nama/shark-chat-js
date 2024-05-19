import * as Base from "@radix-ui/react-popover";
import { ReactNode } from "react";
import { tv } from "tailwind-variants";

export const popover = tv({
  slots: {
    content: [
      "rounded-lg p-4 bg-popover flex flex-col gap-3 z-10 animate-in fade-in shadow-xl text-sm text-popover-foreground dark:shadow-none",
      "focus:outline-none",
    ],
    arrow: "fill-popover",
  },
});

export function Popover({
  trigger,
  children,
}: {
  trigger: ReactNode;
  children: ReactNode;
}) {
  const styles = popover();

  return (
    <Base.Root>
      <Base.Trigger asChild>{trigger}</Base.Trigger>

      <Base.Portal>
        <Base.Content className={styles.content()}>
          <Base.Arrow className={styles.arrow()} />
          {children}
        </Base.Content>
      </Base.Portal>
    </Base.Root>
  );
}
