import { useMemo } from "react";
import { Group } from "@/server/db/schema";
import { useSession } from "next-auth/react";
import { channels } from "../ably/client";
import { Serialize } from "../types";
import { useEventHandlers } from "./base";

export function useMutationHandlers() {
    const base = useEventHandlers();
    const { data } = useSession();

    return useMemo(
        () => ({
            utils: base.utils,
            createGroup: (group: Serialize<Group>) => {
                base.createGroup(group);
                channels.private.group_created.publish([data!!.user.id], group);
            },
            deleteGroup: async (groupId: number) => {
                base.deleteGroup(groupId);
            },
        }),
        [base, data]
    );
}
