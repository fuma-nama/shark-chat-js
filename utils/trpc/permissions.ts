import prisma from "@/server/prisma";
import { TRPCError } from "@trpc/server";
import { Session } from "next-auth";

export async function checkIsMemberOf(group: number, user: Session) {
    const member = await prisma.member.findUnique({
        where: {
            group_id_user_id: {
                group_id: group,
                user_id: user.user.id,
            },
        },
    });

    if (member == null) {
        throw new TRPCError({
            message: "You must join the group in order to receive messages",
            code: "BAD_REQUEST",
        });
    }

    return member;
}

export async function checkIsOwnerOf(group: number, user: Session) {
    const res = await prisma.group.findFirst({
        where: {
            id: group,
            owner_id: user.user.id,
        },
    });

    if (res == null) {
        throw new TRPCError({
            message: "You must be the owner of the group to do this action",
            code: "BAD_REQUEST",
        });
    }
}
