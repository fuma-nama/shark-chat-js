import { channels } from "@/utils/ably/client";
import { useChannels } from "ably-builder/hooks";
import { RouterUtils, trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { Serialize } from "shared/types";
import { Group } from "db/schema";
import { useParams, useRouter } from "next/navigation";

export function GroupEventManager() {
  const router = useRouter();
  const params = useParams() as { group?: string };
  const { status } = useSession();
  const utils = trpc.useUtils();

  const onEvent = channels.group.useCallback(({ name, data: message }) => {
    if (name === "group_deleted") {
      const active = params.group === message.id.toString();

      if (active) {
        router.push("/");
      }

      return utils.group.all.setData(undefined, (groups) =>
        groups?.filter((g) => g.id !== message.id),
      );
    }

    if (name === "group_updated") {
      return updateGroup(utils, message);
    }
  });

  const groups = trpc.group.all.useQuery(undefined, {
    enabled: status === "authenticated",
    staleTime: Infinity,
  });

  const channelList = useMemo(() => {
    if (groups.data == null) return [];

    return groups.data.map((group) => channels.group.get([group.id]));
  }, [groups.data]);

  useChannels(channelList, onEvent);

  return <></>;
}

function updateGroup(utils: RouterUtils, group: Serialize<Group>) {
  utils.group.info.setData({ groupId: group.id }, group);
  utils.group.all.setData(undefined, (groups) =>
    groups?.map((g) => (g.id === group.id ? { ...g, ...group } : g)),
  );
}
