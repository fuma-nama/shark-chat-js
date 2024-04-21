import { ComponentPropsWithRef } from "react";
import { tv } from "tailwind-variants";
import { input } from "ui/components/input";

const inputStyles = tv({
  slots: {
    root: "flex flex-row",
    input: input({ className: "rounded-l-none" }),
    left: [
      "rounded-l-md border-[1px] border-r-0 bg-light-50 border-accent-600 px-2 flex",
      "dark:border-accent-900 dark:bg-dark-800",
    ],
  },
});

export function UniqueNameInput(props: {
  input?: ComponentPropsWithRef<"input">;
  root?: ComponentPropsWithRef<"div">;
}) {
  const styles = inputStyles();

  return (
    <div
      {...props.root}
      className={styles.root({ className: props.root?.className })}
    >
      <div className={styles.left()}>
        <p className="text-lg m-auto">@</p>
      </div>
      <input
        {...props.input}
        className={styles.input({ className: props.input?.className })}
      />
    </div>
  );
}
