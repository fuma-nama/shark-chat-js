import { BaseLayout } from "@/components/layout/base";
import { NextPageWithLayout } from "../_app";
import { text } from "@/components/system/text";
import { GetServerSideProps } from "next";
import { Group } from "@/server/db/schema";
import { Avatar } from "@/components/system/avatar";
import { groupIcon } from "@/utils/media/format";
import { Button } from "@/components/system/button";
import { useMutationHandlers } from "@/utils/handlers/trpc";
import { useMutation } from "@tanstack/react-query";
import Router from "next/router";
import Head from "next/head";
import db from "@/server/db/client";
import { groupInvites, groups } from "@/server/db/schema";
import { eq } from "drizzle-orm";

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
            <Head>
                <title>Invite to {group.name}</title>
                <meta
                    name="description"
                    content={`Join @${group.unique_name} on Shark Chat`}
                />
            </Head>
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

InvitePage.useLayout = (c) => <BaseLayout customMeta>{c}</BaseLayout>;

export const getServerSideProps: GetServerSideProps<Props | {}> = async ({
    query,
}) => {
    const code = query["invite"] as string;

    if (code.startsWith("@")) {
        const name = code.slice(1);
        const groupResult = await db
            .select()
            .from(groups)
            .where(eq(groups.unique_name, name));
        const group = groupResult[0];

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
        const inviteResult = await db
            .select({ group: groups })
            .from(groupInvites)
            .where(eq(groupInvites.code, code))
            .leftJoin(groups, eq(groups.id, groupInvites.group_id));

        if (inviteResult[0] != null) {
            return {
                props: {
                    group: inviteResult[0].group,
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
