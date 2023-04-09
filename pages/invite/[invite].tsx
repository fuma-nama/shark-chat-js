import { BaseLayout } from "@/components/layout/base";
import { NextPageWithLayout } from "../_app";
import { text } from "@/components/system/text";
import { GetServerSideProps } from "next";
import { Group } from "@prisma/client";
import prisma from "@/server/prisma";
import { Avatar } from "@/components/system/avatar";
import { groupIcon } from "@/utils/media/format";
import { Button } from "@/components/system/button";
import { useMutationHandlers } from "@/utils/handlers/trpc";
import { useMutation } from "@tanstack/react-query";
import Router from "next/router";

type Props = {
    group: Group;
    type: "code" | "name";
    query: string;
};

const InvitePage: NextPageWithLayout<Props> = ({ group, type, query }) => {
    const handlers = useMutationHandlers();
    const client = handlers.utils.client;
    const join = useMutation(
        async () => {
            return type === "code"
                ? client.group.join.mutate({ code: query })
                : client.group.joinByUniqueName.mutate({ uniqueName: query });
        },
        {
            async onSuccess(data) {
                handlers.createGroup(data);
                await Router.push(`/chat/${data.id}`);
            },
        }
    );

    return (
        <div className="m-auto bg-light-100 dark:bg-dark-800 rounded-xl p-6 w-full max-w-md flex flex-col gap-3 items-center">
            <Avatar
                src={
                    group.icon_hash != null
                        ? groupIcon.url([group.id], group.icon_hash)
                        : null
                }
                size="medium"
                fallback={group.name}
            />
            <div className="text-center">
                <h2 className={text({ type: "secondary", size: "sm" })}>
                    You are invited to{" "}
                    <span className="text-brand-500 dark:text-brand-300">
                        @{group.unique_name}
                    </span>
                </h2>
                <h1 className={text({ type: "primary", size: "xl" })}>
                    {group.name}
                </h1>
            </div>
            <Button
                color="primary"
                className="w-full mt-3"
                isLoading={join.isLoading}
                onClick={() => join.mutate()}
            >
                Accept
            </Button>
        </div>
    );
};

InvitePage.useLayout = (c) => <BaseLayout>{c}</BaseLayout>;

export const getServerSideProps: GetServerSideProps<Props | {}> = async ({
    query,
}) => {
    const code = query["invite"] as string;

    if (code.startsWith("@")) {
        const name = code.slice(1);

        const group = await prisma.group.findUnique({
            where: {
                unique_name: name,
            },
        });

        if (group != null && group.public) {
            return {
                props: {
                    group,
                    query: name,
                    type: "name",
                },
            };
        }
    } else {
        const invite = await prisma.groupInvite.findUnique({
            where: {
                code,
            },
            include: {
                group: true,
            },
        });

        if (invite != null) {
            return {
                props: {
                    group: invite.group,
                    query: code,
                    type: "code",
                },
            };
        }
    }

    return {
        notFound: true,
    };
};
export default InvitePage;
