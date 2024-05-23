import { schema } from "./schema";
import { createPublish } from "shared/ably";
import Ably from "ably";

function connect() {
  return new Ably.Rest({
    key: process.env.ABLY_API_KEY,
    //make sure time is sync in development mode
    queryTime: process.env.NODE_ENV === "development",
  });
}

let ably: Ably.Rest;

if (process.env.NODE_ENV === "development") {
  const ctx = globalThis as { dev_ably?: Ably.Rest };
  let cachedAbly = ctx.dev_ably;

  if (!cachedAbly) {
    cachedAbly = ctx.dev_ably = connect();
  }

  ably = cachedAbly;
} else {
  ably = connect();
}

export const { publish } = createPublish(ably, schema);

export default ably;
