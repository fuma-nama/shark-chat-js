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

export function getMessageVariables(channelId: string) {
    return {
        channelId: channelId,
        count: 30,
        cursorType: "before",
    } as const;
}
