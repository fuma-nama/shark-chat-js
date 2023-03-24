import { useMemo } from "react";
import { trpc } from "@/utils/trpc";
import { Group } from "@prisma/client";
import { Serialize } from "../types";

export function useBaseHandlers() {
    const utils = trpc.useContext();

    return useMemo(
        () => ({
            utils,
            createGroup: (group: Serialize<Group>) => {
                utils.group.info.setData({ groupId: group.id }, group);
                utils.group.all.setData(undefined, (groups) =>
                    groups != null ? [...groups, group] : undefined
                );
            },
            updateGroup: (group: Serialize<Group>) => {
                utils.group.info.setData({ groupId: group.id }, group);
                utils.group.all.setData(undefined, (groups) =>
                    groups?.map((g) => (g.id === group.id ? group : g))
                );
            },
        }),
        [utils]
    );
}
