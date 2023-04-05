import { channels } from "@/utils/ably";
import Ably, { Types } from "ably";

function connect() {
    const ably = new Ably.Realtime.Promise({
        key: process.env.ABLY_API_KEY,
        //make sure time is sync in development mode
        queryTime: process.env.NODE_ENV === "development",
    });

    ably.connection.on("connected", () => console.log("Connected to Ably!"));

    return ably;
}

declare global {
    var dev_ably: Types.RealtimePromise;
}

let ably: Types.RealtimePromise;

if (process.env.NODE_ENV === "development") {
    if (global.dev_ably == null) {
        global.dev_ably = connect();
    }

    ably = global.dev_ably;
} else {
    ably = connect();
}

channels.config(ably);
export default ably;
