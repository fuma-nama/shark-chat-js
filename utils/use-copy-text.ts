import { useMutation } from "@tanstack/react-query";
export function useCopyTextMutation() {
    return useMutation(async (data: string) => {
        await navigator.clipboard.writeText(data);
    });
}
