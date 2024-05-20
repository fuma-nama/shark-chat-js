import { schema } from "./schema";
import { createPublish } from "shared/ably";
import Ably, { Rest } from "ably";

function connect() {
  return new Ably.Rest({
    key: process.env.ABLY_API_KEY,
    //make sure time is sync in development mode
    queryTime: process.env.NODE_ENV === "development",
  });
}

declare global {
  var dev_ably: Rest;
}

let ably: Rest;

if (process.env.NODE_ENV === "development") {
  if (global.dev_ably == null) {
    global.dev_ably = connect();
  }

  ably = global.dev_ably;
} else {
  ably = connect();
}

export const { publish } = createPublish(ably, schema);

export default ably;
