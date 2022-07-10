import { EventEmitter } from "node:events";
import dgram from "node:dgram";
import { buildPackets, flags, splitBuffer } from "./utils.mjs";
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

    processIncomingMessage(message, rInfo) {
        const { header, data } = this.parseMessage(message);
        switch (header.flag) {
            case flags.requestForPacket: {
            }
            default: {
                throw new Error(`invalid flag ${header.flag}`);
            }
        }
    }

    parseMessage(message) {
        const messageString = message.toString();
        const messageJson = JSON.parse(messageString);
        const { header, data } = messageJson;
        const dataBuffer = Buffer.from(data.data);
        return {
            header,
            data: dataBuffer,
        };
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
