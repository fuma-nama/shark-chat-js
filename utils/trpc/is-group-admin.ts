import { useSession } from "next-auth/react";
import { trpc } from "./index";

export function useIsGroupAdmin({ groupId }: { groupId: number }) {
    const query = trpc.group.info.useQuery({ groupId });
    const { status, data } = useSession();

    if (status !== "authenticated" || query.data == null) return false;

    return query.data.owner_id === data.user.id;
}
