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

    const userId = () => data!!.user.id;

    //Don't await publish()
    //For faster speed
    return {
        ...base,
        createGroup: (group: Serialize<Group>) => {
            base.createGroup(group);
            channels.private.group_created.publish(ably, [userId()], group);
        },
        updateGroup: (group: Serialize<Group>) => {
            base.updateGroup(group);
            channels.private.group_updated.publish(ably, [userId()], group);
        },
    };
}
