import { useMemo } from "react";
import { Group } from "@prisma/client";
import { useSession } from "next-auth/react";
import { channels } from "../ably";
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
