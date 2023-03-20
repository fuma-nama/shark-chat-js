import { useBaseHandlers } from "./base";

export function useTrpcHandlers() {
    const base = useBaseHandlers();

    return {
        ...base,
    };
}
