import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { AblyMessageCallback, useAbly } from "ably/react";
import { schema } from "server/ably/schema";

export function GroupEventManager() {
  const router = useRouter();
  const params = useParams() as { group?: string };
  const { status } = useSession();
  const utils = trpc.useUtils();
  const ably = useAbly();
  const callback = useRef<AblyMessageCallback>();

  callback.current = useCallback<AblyMessageCallback>(
    ({ name, data }) => {
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
    },
    [params, router, utils],
  );

  const groups = trpc.group.all.useQuery(undefined, {
    enabled: status === "authenticated",
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!groups.data) return;

    const listener: AblyMessageCallback = (res) => callback.current?.(res);
    const channels = groups.data.map((group) =>
      ably.channels.get(schema.group.name(group.id)),
    );

    for (const c of channels) {
      void c.subscribe(listener);
    }
    return () => {
      for (const c of channels) {
        void c.unsubscribe(listener);
      }
    };
  }, [ably, groups.data]);

  return <></>;
}
