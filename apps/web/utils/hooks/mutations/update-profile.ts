import { useMutation } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { upload } from "./upload";

export interface UpdateProfileOptions {
  name?: string;
  avatar?: string;
  banner?: string;
}

export function useUpdateProfileMutation() {
  const client = trpc.useUtils().client;

  return useMutation(async ({ name, avatar, banner }: UpdateProfileOptions) => {
    let avatar_url: string | undefined;
    let banner_hash: number | undefined;

    if (avatar) {
      const uploaded = await upload(
        () => client.upload.signAvatar.query(undefined),
        avatar,
      );
      avatar_url = uploaded.secure_url;
    }

    if (banner) {
      const uploaded = await upload(
        () => client.upload.signUserBanner.query(),
        banner,
      );

      banner_hash = uploaded.version;
    }

    return client.account.updateProfile.mutate({
      name,
      avatar_url,
      banner_hash,
    });
  });
}
