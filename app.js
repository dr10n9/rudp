import { Server } from "./index.mjs";
import { Client } from "./index";
import { sleep } from "./index.mjs";

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
