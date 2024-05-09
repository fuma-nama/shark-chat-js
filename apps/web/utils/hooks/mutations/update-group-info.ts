import { useMutation } from "@tanstack/react-query";
import { upload } from "./upload";
import { RouterInput, RouterUtils, trpc } from "../../trpc";
import type { UseMutationOptions } from "@tanstack/react-query/src/types";

type Input = Omit<
  RouterInput["group"]["update"],
  "icon_hash" | "banner_hash"
> & {
  banner?: string;
  icon?: string;
};

export async function updateGroupInfo(
  { client }: RouterUtils,
  { icon, banner, ...rest }: Input,
) {
  let icon_hash: number | undefined;
  let banner_hash: number | undefined;

  if (icon != null) {
    const uploaded = await upload(
      () =>
        client.upload.signGroupIcon.query({
          groupId: rest.groupId,
        }),
      icon,
    );

    icon_hash = uploaded.version;
  }

  if (banner) {
    const uploaded = await upload(
      () =>
        client.upload.signGroupBanner.query({
          groupId: rest.groupId,
        }),
      banner,
    );

    banner_hash = uploaded.version;
  }

  return client.group.update.mutate({
    ...rest,
    icon_hash,
    banner_hash,
  });
}

export function useUpdateGroupInfoMutation(
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof updateGroupInfo>>,
      unknown,
      unknown
    >,
    "mutationFn"
  >,
) {
  const utils = trpc.useUtils();

  return useMutation((input: Input) => updateGroupInfo(utils, input), options);
}
