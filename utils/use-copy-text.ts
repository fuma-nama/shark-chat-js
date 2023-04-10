import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";

type State = {
    show: boolean;
    timer: NodeJS.Timeout | null;
};

export function useCopyText(timeout = 1000) {
    const [{ show, timer }, set] = useState<State>({
        show: false,
        timer: null,
    });

    const mutation = useMutation(
        async (data: string) => {
            await navigator.clipboard.writeText(data);
        },
        {
            onSuccess: () => {
                const timer = setTimeout(
                    () => set({ show: false, timer: null }),
                    timeout
                );

                set({ show: true, timer });
            },
        }
    );

    useEffect(() => {
        return () => {
            if (timer != null) {
                clearTimeout(timer);
            }
        };
    }, [timer]);

    return {
        copy: (s: string) => mutation.mutate(s),
        isShow: show,
    };
}
