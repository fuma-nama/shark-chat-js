import { useMutation } from "@tanstack/react-query";
import { trpc } from ".";
import { upload } from "../media/upload";
import { RouterInput } from "./types";

type Input = Omit<RouterInput["group"]["update"], "icon_hash"> & {
    icon?: string;
};

export function useUpdateGroupInfoMutation() {
    const client = trpc.useContext().client;

    return useMutation(async ({ icon, ...rest }: Input) => {
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
    });
}
