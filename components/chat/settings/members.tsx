import { Avatar } from "@/components/system/avatar";
import { Button } from "@/components/system/button";
import { text } from "@/components/system/text";
import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";

export default function Members({
    group,
    isAdmin,
}: {
    group: number;
    isAdmin: boolean;
}) {
    const utils = trpc.useContext();
    const { status, data } = useSession();
    const query = trpc.group.member.get.useQuery(
        { groupId: group },
        { enabled: status === "authenticated" }
    );
    const kick = trpc.group.member.kick.useMutation({
        onSuccess(_, { groupId, userId }) {
            utils.group.member.get.setData({ groupId }, (prev) =>
                prev?.filter((member) => member.user_id !== userId)
            );
        },
    });

    return (
        <div className="flex flex-col gap-3">
            {query.data?.map((member) => (
                <div
                    key={member.user_id}
                    className="flex flex-row items-center gap-3"
                >
                    <Avatar
                        alt="avatar"
                        size="medium"
                        src={member.user.image}
                        fallback={member.user.name}
                    />
                    <p className={text({ size: "md", type: "primary" })}>
                        {member.user.name}
                    </p>
                    {isAdmin && data?.user?.id !== member.user_id && (
                        <Button
                            color="danger"
                            className="ml-auto"
                            isLoading={kick.isLoading}
                            onClick={() =>
                                kick.mutate({
                                    groupId: group,
                                    userId: member.user_id,
                                })
                            }
                        >
                            Kick
                        </Button>
                    )}
                </div>
            ))}
        </div>
    );
}
