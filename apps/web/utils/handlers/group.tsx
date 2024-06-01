import { trpc } from "@/utils/trpc";
import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { schema } from "server/ably/schema";
import { useAbly } from "@/utils/ably/client";
import { useCallbackRef } from "@/utils/hooks/use-callback-ref";
import type { AblyMessageCallback } from "ably/react";

let previousGroupIds: string[] = [];
export function GroupEventManager() {
  const router = useRouter();
  const params = useParams() as { group?: string };
  const utils = trpc.useUtils();
  const ably = useAbly();

  const callback = useCallbackRef<AblyMessageCallback>(({ name, data }) => {
    if (name === "group_deleted") {
      const message = schema.group[name].parse(data);
      const active = params.group === message.id.toString();

      if (active) {
        router.push("/");
      }

      utils.group.all.setData(undefined, (groups) =>
        groups?.filter((g) => g.id !== message.id),
      );
      return;
    }

    if (name === "group_updated") {
      const message = schema.group[name].parse(data);

      utils.group.info.setData({ groupId: message.groupId }, (prev) =>
        prev ? { ...prev, ...message.group } : undefined,
      );
      utils.group.all.setData(undefined, (groups) =>
        groups?.map((item) =>
          item.id === message.groupId ? { ...item, ...message.group } : item,
        ),
      );
      return;
    }
  });

  const groups = trpc.group.all.useQuery(undefined, {
    staleTime: Infinity,
  });

  const groupIds: string[] = useMemo(
    () => groups.data?.map((group) => group.id) ?? [],
    [groups.data],
  );

  useEffect(() => {
    if (!ably) return;

    for (const prev of previousGroupIds) {
      if (groupIds.includes(prev)) continue;
      void ably.channels.get(schema.group.name(prev)).unsubscribe();
    }

    for (const id of groupIds) {
      if (previousGroupIds.includes(id)) continue;
      void ably.channels.get(schema.group.name(id)).subscribe(callback);
    }

    previousGroupIds = groupIds;
  }, [ably, callback, groupIds]);

  return <></>;
}
