import { Server } from "./lib/server.mjs";
import { Client } from "./lib/client.mjs";
import { flags, sleep } from "./lib/utils.mjs";

const server = new Server("localhost", 12345);

server.on('newConnection', client => {
    client.on('message', (data) => {
        console.log(`handler ${client.address}:${client.port}`, data.toString())
    })
})

const client = new Client("localhost", 12345);
await client.connect();
client.sendMessage("Hello, world 111111111111111111111111111111111111111!");
// client.client.send(JSON.stringify({
//     header : {
//         flag : flags.connect,
//     }
// }))
// while (true) {
//     await client.sendMessage("world hello!!");
//     await sleep(100);
// }

