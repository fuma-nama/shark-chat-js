import { getServerSession } from "next-auth/next";
import type { NextApiRequest, NextApiResponse } from "next";
import ably from "@/server/ably";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const session = await getServerSession(req, res, authOptions);
    const clientId = session?.user.id;

    if (clientId == null) {
        return res
            .status(401)
            .json("You must be login before connecting to Ably");
    }
    console.log(`Ably auth called ${clientId}`);

    const tokenRequestData = await ably.auth.createTokenRequest({
        clientId: clientId,
        capability: {
            [`private:${clientId}`]: ["subscribe"],
        },
    });

    return res.status(200).json(tokenRequestData);
}
