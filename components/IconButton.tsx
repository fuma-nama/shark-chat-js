import { ComponentProps, forwardRef } from "react";

type Props = Omit<ComponentProps<"button">, "className">;
const IconButton = forwardRef<HTMLButtonElement, Props>((props, ref) => (
    <button
        ref={ref}
        className="rounded-full bg-gradient-to-br from-brand-400 to-brand-500 text-accent-50 p-3"
        {...props}
    />
));

IconButton.displayName = "IconButton";
export default IconButton;
