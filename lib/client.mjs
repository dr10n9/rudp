import { EventEmitter } from "node:events";
import dgram from "node:dgram";
import { buildPackets, splitBuffer } from "./utils.mjs";
export class Client extends EventEmitter {
    constructor(host, port) {
        super();
        const client = dgram.createSocket("udp4");
        this.host = host;
        this.port = port;
        this.client = client;
        this.messages = {};
        this.isConnected = false;
        this.client.on("message", (data, rInfo) => {
            this.processIncomingMessage(data, rInfo);
        });
    }

    processIncomingMessage(data, rInfo) {
        console.log(data);
    }

    async connect() {
        return new Promise((resolve) => {
            this.client.on("connect", () => {
                this.isConnected = true;
                return resolve();
            });
            this.client.connect(this.port, this.host);
        });
    }

    async sendMessage(data) {
        if (!this.isConnected) throw new Error("not connected");
        // process data
        const buffer = Buffer.from(data);
        const array = splitBuffer(buffer);
        const { messagingCycle, finish } = buildPackets(array);
        for (const item of messagingCycle) {
            this.client.send(JSON.stringify(item));
        }

        this.client.send(JSON.stringify(finish));
    }
}
