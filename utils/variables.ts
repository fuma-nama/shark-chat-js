import { NextRouter } from "next/router";

export function getGroupQuery(router: NextRouter) {
    const query = router.query as {
        group: string;
    };

    return {
        isReady: router.isReady,
        groupId: Number(query.group),
    };
}

export function getMessageVariables(groupId: number) {
    return {
        groupId,
        count: 30,
        cursorType: "before",
    } as const;
}

export type DirectMessageQuery = {
    user: string;
};

export function getDirectMessageVariables(userId: string) {
    return {
        userId,
        count: 30,
        cursorType: "before",
    } as const;
}
