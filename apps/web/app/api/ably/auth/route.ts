import { getServerSession } from "next-auth/next";
import ably from "server/ably";
import { authOptions } from "server/auth";
import { NextResponse } from "next/server";
import { schema } from "server/ably/schema";

export async function POST() {
  const session = await getServerSession(authOptions);
  const clientId = session?.user.id;

  if (clientId == null) {
    return NextResponse.json("You must login before connecting to Ably", {
      status: 401,
    });
  }

  const tokenRequestData = await ably.auth.createTokenRequest({
    clientId: clientId,
    capability: {
      [schema.private.name(clientId)]: ["subscribe", "publish", "presence"],
      ["group:*"]: ["subscribe", "presence"],
      ["chat:*"]: ["subscribe", "presence"],
      ["chat:*:typing"]: ["subscribe", "publish"],
    },
  });

  return NextResponse.json(tokenRequestData);
}
