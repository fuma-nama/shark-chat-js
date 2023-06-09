import { useMutation } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { upload } from "./upload";

export function useUpdateProfileMutation() {
    const client = trpc.useContext().client;

    return useMutation(
        async ({ name, avatar }: { name?: string; avatar?: string }) => {
            let avatar_url: string | undefined;

            if (avatar != null) {
                const uploaded = await upload(
                    () => client.upload.signAvatar.query(undefined),
                    avatar
                );
                avatar_url = uploaded.secure_url;
            }

            return client.account.updateProfile.mutate({
                name,
                avatar_url,
            });
        }
    );
}
