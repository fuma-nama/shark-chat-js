import { getServerSession } from "next-auth/next";
import ably, { channels } from "server/ably";
import { authOptions } from "server/auth";
import { NextResponse } from "next/server";

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
      [channels.private.channelName([clientId])]: ["subscribe", "publish"],
      ["group:*"]: ["subscribe"],
      ["chat:*"]: ["subscribe"],
    },
  });

  return NextResponse.json(tokenRequestData);
}
