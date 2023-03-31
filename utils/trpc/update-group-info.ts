import { useMutation } from "@tanstack/react-query";
import { upload } from "../media/upload";
import { useMutationHandlers } from "../handlers/trpc";
import type { RouterInput } from "./index";

type Input = Omit<RouterInput["group"]["update"], "icon_hash"> & {
    icon?: string;
};

export function useUpdateGroupInfoMutation() {
    const handlers = useMutationHandlers();
    const client = handlers.utils.client;

    return useMutation(
        async ({ icon, ...rest }: Input) => {
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
        },
        {
            onSuccess: (data) => handlers.updateGroup(data),
        }
    );
}
