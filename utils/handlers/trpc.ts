import { useMemo } from "react";
import { assertConfiguration } from "@ably-labs/react-hooks";
import { Group } from "@prisma/client";
import { useSession } from "next-auth/react";
import { channels } from "../ably";
import { Serialize } from "../types";
import { useBaseHandlers } from "./base";

export function useTrpcHandlers() {
    const ably = assertConfiguration();
    const base = useBaseHandlers();
    const { data } = useSession();

    //Don't await publish()
    //For faster speed
    return useMemo(
        () => ({
            ...base,
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
