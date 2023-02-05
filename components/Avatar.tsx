import * as AvatarBase from "@radix-ui/react-avatar";
import { AvatarIcon } from "@radix-ui/react-icons";
import clsx from "clsx";

export default function Avatar({
    variant,
    ...props
}: {
    src?: string;
    alt?: string;
    fallback?: string;
    variant?: "large";
}) {
    return (
        <AvatarBase.Root
            className={clsx(
                "relative inline-flex",
                variant == null && "h-10 w-10",
                variant == "large" && "w-20 h-20"
            )}
        >
            <AvatarBase.Image
                {...props}
                className="h-full w-full object-cover rounded-full"
            />
            <AvatarBase.Fallback
                className="flex h-full w-full items-center justify-center bg-light dark:bg-dark-800"
                delayMs={600}
            >
                <AvatarIcon className="text-sm font-medium uppercase text-accent-700 dark:text-accent-400" />
            </AvatarBase.Fallback>
        </AvatarBase.Root>
    );
}
