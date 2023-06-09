import { useMutation } from "@tanstack/react-query";
import { upload } from "./upload";
import { RouterInput, RouterUtils, trpc } from "../../trpc";

type Input = Omit<RouterInput["group"]["update"], "icon_hash"> & {
    icon?: string;
};

export async function updateGroupInfo(
    { client }: RouterUtils,
    { icon, ...rest }: Input
) {
    let icon_hash: number | undefined;

    if (icon != null) {
        const uploaded = await upload(
            () =>
                client.upload.signGroupIcon.query({
                    groupId: rest.groupId,
                }),
            icon
        );
        icon_hash = uploaded.version;
    }

    return client.group.update.mutate({
        ...rest,
        icon_hash,
    });
}

export function useUpdateGroupInfoMutation() {
    const utils = trpc.useContext();

    return useMutation((input: Input) => updateGroupInfo(utils, input));
}
