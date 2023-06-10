import { useEffect, useState } from "react";

type State = {
    show: boolean;
    timer: NodeJS.Timeout | null;
};

export function useCopyText(timeout = 1000) {
    const [{ show, timer }, set] = useState<State>({
        show: false,
        timer: null,
    });

    const onCopy = async (data: string) => {
        await navigator.clipboard.writeText(data);

        const timer = setTimeout(
            () => set({ show: false, timer: null }),
            timeout
        );

        set({ show: true, timer });
    };

    useEffect(() => {
        return () => {
            if (timer != null) {
                clearTimeout(timer);
            }
        };
    }, [timer]);

    return {
        copy: onCopy,
        isShow: show,
    };
}
