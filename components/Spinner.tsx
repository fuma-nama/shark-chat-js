import clsx from "clsx";

export function Spinner({ size = "small" }: { size?: "small" | "large" }) {
    return (
        <div className="flex justify-center items-center">
            <div
                className={clsx(
                    "align-[-0.125rem] border-r-transparent animate-spin inline-block rounded-full",
                    size === "small" && "w-4 h-4 border-2",
                    size === "large" && "w-8 h-8 border-4"
                )}
                role="status"
            />
        </div>
    );
}
