import {Client} from './lib/client.mjs'

const client = new Client('localhost', 12345);
await client.connect();
while (true) {
    await client.sendMessage('Hello, world!');
    await sleep(100)
}

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }