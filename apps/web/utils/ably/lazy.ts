import {
  BaseRealtime,
  FetchRequest,
  RealtimePresence,
  WebSocketTransport,
} from "ably/modular";
import { getBaseUrl } from "@/utils/get-base-url";

const ably = new BaseRealtime({
  authUrl: `${getBaseUrl()}/api/ably/auth`,
  authMethod: "POST",
  autoConnect: false,
  plugins: {
    FetchRequest,
    WebSocketTransport,
    RealtimePresence,
  },
});

ably.connection.on("connected", () => console.log("Ably Client connected"));
ably.connection.on("closed", () => console.log("Ably Client disconnected"));

export default ably;
