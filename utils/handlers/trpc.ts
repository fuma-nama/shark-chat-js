import { useMemo } from "react";
import { assertConfiguration } from "@ably-labs/react-hooks";
import { Group } from "@prisma/client";
import { useSession } from "next-auth/react";
import { channels } from "../ably";
import { Serialize } from "../types";
import { useEventHandlers } from "./base";

export function useMutationHandlers() {
    const ably = assertConfiguration();
    const base = useEventHandlers();
    const { data } = useSession();

    return useMemo(
        () => ({
            utils: base.utils,
            createGroup: (group: Serialize<Group>) => {
                base.createGroup(group);
                channels.private.group_created.publish(
                    ably,
                    [data!!.user.id],
                    group
                );
            },
            updateGroup: (group: Serialize<Group>) => {
                base.updateGroup(group);
                channels.private.group_updated.publish(
                    ably,
                    [data!!.user.id],
                    group
                );
            },
        }),
        [ably, base, data]
    );
}
