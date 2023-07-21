import { Group, groupInvites, groups } from "db/schema";
import { Avatar } from "ui/components/avatar";
import { groupIcon } from "shared/media/format";
import db from "db/client";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { InviteButton, LoginButton } from "./buttons";
import { Metadata } from "next";
import { getServerSession } from "next-auth";

type Data = {
    group: Group;
    type: "code" | "name";
    query: string;
};

export default async function InvitePage({
    params,
}: {
    params: { invite: string };
}) {
    const info = await getGroupInfo(params.invite);

    if (info == null) {
        notFound();
    }

    const session = await getServerSession();
    const { group, query, type } = info;

    return (
        <main className="flex flex-col items-center justify-center bg-gradient-to-b from-light-50 to-light-400  dark:from-dark-600 dark:to-dark-950 min-h-screen p-4">
            <div className="flex flex-col gap-2 sm:gap-4 items-center text-center p-6 w-full max-w-sm border-[1px] rounded-xl bg-card/50 shadow-lg">
                <Avatar
                    src={groupIcon.url([group.id], group.icon_hash)}
                    size="medium"
                    fallback={group.name}
                />
                <div className="text-center">
                    <h2 className="text-sm text-muted-foreground">
                        You are invited to{" "}
                        <span className="text-brand-500 dark:text-brand-300">
                            @{group.unique_name}
                        </span>
                    </h2>
                    <h1 className="text-foreground text-xl font-bold">
                        {group.name}
                    </h1>
                </div>
                {session == null ? (
                    <LoginButton />
                ) : (
                    <InviteButton type={type} query={query} />
                )}
            </div>
        </main>
    );
}

export async function generateMetadata({
    params,
}: {
    params: { invite: string };
}): Promise<Metadata | undefined> {
    const info = await getGroupInfo(params.invite);

    if (info != null) {
        const title = `Invite to ${info.group.name}`;
        const description = `Join ${info.group.name} (@${info.group.unique_name}) on Shark Chat`;

        return {
            title,
            description,
            openGraph: {
                title,
                description,
            },
            twitter: {
                title,
                description,
            },
        };
    }
}

async function getGroupInfo(query: string): Promise<Data | null> {
    const code = decodeURIComponent(query);

    if (code.startsWith("@")) {
        const name = code.slice(1);
        const groupResult = await db
            .select()
            .from(groups)
            .where(eq(groups.unique_name, name));
        const group = groupResult[0];

        if (group != null && group.public) {
            return {
                group,
                query: name,
                type: "name",
            };
        }
    } else {
        const inviteResult = await db
            .select({ group: groups })
            .from(groupInvites)
            .where(eq(groupInvites.code, code))
            .innerJoin(groups, eq(groups.id, groupInvites.group_id));

        if (inviteResult[0] != null) {
            return {
                group: inviteResult[0].group,
                query: code,
                type: "code",
            };
        }
    }

    return null;
}
