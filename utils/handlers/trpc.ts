import { useMemo } from "react";
import { Group } from "@prisma/client";
import { useSession } from "next-auth/react";
import { channels } from "../ably";
import { Serialize } from "../types";
import { useEventHandlers } from "./base";
import Router from "next/router";
import { getQuery } from "@/pages/chat/[group]";

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
            updateGroup: (group: Serialize<Group>) => {
                base.updateGroup(group);
                channels.private.group_updated.publish([data!!.user.id], group);
            },
            deleteGroup: async (groupId: number) => {
                if (
                    Router.asPath.startsWith(`/chat/`) &&
                    getQuery(Router).groupId === groupId
                ) {
                    await Router.push("/home");
                }

                base.deleteGroup(groupId);
                channels.private.group_deleted.publish([data!!.user.id], {
                    id: groupId,
                });
            },
        }),
        [base, data]
    );
}
