import { Server } from "./lib/server.mjs";
import { Client } from "./lib/client.mjs";
import { sleep } from "./lib/utils.mjs";

/**
 * flags
 * init
 * ack
 * noack
 * end
 */

const server = new Server("localhost", 12345);

server.on("message", (data) => {
    console.log(data.toString());
});

const client = new Client("localhost", 12345);
await client.connect();
client.sendMessage("Hello, world 111111111111111111111111111111111111111!");
while (true) {
    await client.sendMessage("world hello!!");
    await sleep(100);
}

/**
 * send message:
 * split to buffer[]
 * build messages
 * build ack map
 * send messages (set timers for each?)
 * wait for ack
 */
