import * as AvatarBase from "@radix-ui/react-avatar";
import { AvatarIcon } from "@radix-ui/react-icons";

export default function Avatar(props: {
    src?: string;
    alt?: string;
    fallback?: string;
}) {
    return (
        <AvatarBase.Root className="relative inline-flex h-10 w-10">
            <AvatarBase.Image
                {...props}
                className="h-full w-full object-cover rounded-full"
            />
            <AvatarBase.Fallback
                className="flex h-full w-full items-center justify-center bg-white dark:bg-gray-800"
                delayMs={600}
            >
                <AvatarIcon className="text-sm font-medium uppercase text-gray-700 dark:text-gray-400" />
            </AvatarBase.Fallback>
        </AvatarBase.Root>
    );
}
