import Ably from "ably";

// For the full code sample see here: https://github.com/ably/quickstart-js
const ably = new Ably.Realtime.Promise({
    key: process.env.ABLY_API_KEY,
});

console.log("Connected to Ably!");

export default ably;
