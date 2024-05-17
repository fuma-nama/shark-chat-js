import { trpc } from "@/utils/trpc";
import { useMemo } from "react";
import { GroupWithNotifications } from "server/routers/group/group";

export function useGroup(
  groupId: string | number,
): GroupWithNotifications | undefined {
  const query = trpc.group.all.useQuery(undefined, { enabled: false });

  return useMemo(
    () => query.data?.find((group) => group.id === groupId),
    [groupId, query.data],
  );
}
