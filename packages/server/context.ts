import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import type { NextRequest } from "next/server";

export async function createContext(req: NextRequest) {
  return {
    req,
    session: await getServerSession(authOptions),
  };
}
