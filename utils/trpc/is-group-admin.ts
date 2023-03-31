import { useSession } from "next-auth/react";
import { trpc } from "./index";

type IsGroupAdminResult =
    | {
          loading: false;
          value: boolean;
      }
    | {
          loading: true;
      };

export function useIsGroupAdmin({
    groupId,
}: {
    groupId: number;
}): IsGroupAdminResult {
    const { status, data } = useSession();
    const query = trpc.group.info.useQuery({ groupId });

    if (status === "loading" || query.isLoading) {
        return { loading: true };
    }

    return {
        loading: false,
        value:
            status === "authenticated" &&
            query.data != null &&
            query.data.owner_id === data.user.id,
    };
}
