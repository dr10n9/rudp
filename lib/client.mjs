import { EventEmitter } from "node:events";
import dgram from "node:dgram";
import { buildPackets, flags, splitBuffer, types } from "./utils.mjs";
export class Client extends EventEmitter {
    constructor(host, port) {
        super();
        const client = dgram.createSocket("udp4");
        this.host = host;
        this.port = port;
        this.client = client;
        this.messages = {};
        this.isConnected = false;
        this.isConnecting = false;
        this.client.on("message", (data, rInfo) => {
            this.processIncomingMessage(data, rInfo);
        });

        this.transmissions = {};
    }

    processAckMessage({ header, data, rInfo }) {
        if (header.type === types.ack) {
            this.transmissions[header.transmissionId].acks[
                header.packetNumber
            ] = true;

            if (
                Object.values(
                    this.transmissions[header.transmissionId].acks
                ).every((item) => item === true)
            ) {
                this.client.send(
                    JSON.stringify({
                        header: {
                            flag: flags.end,
                            transmissionId: header.transmissionId,
                            totalLength:
                                this.transmissions[header.transmissionId]
                                    .totalLength,
                            packetNumber: Object.keys(
                                this.transmissions[header.transmissionId].acks
                            ).length,
                        },
                    })
                );
                delete this.transmissions[header.transmissionId];
            }
        } else {
            if (!this.transmissions[header.transmissionId])
                this.transmissions[header.transmissionId] = { data: {} };
            this.transmissions[header.transmissionId].data[
                header.packetNumber
            ] = data;
            if (header.flag === flags.ack) {
                const packet = this.buildAcknowledgmentPacket(header);
                this.client.send(JSON.stringify(packet));
            }
        }
    }

    processEndMessage({ header, data, rInfo }) {
        const finalData = Object.values(
            this.transmissions[header.transmissionId].data
        ).map((item) => item);
        this.emit("message", Buffer.concat(finalData));
        delete this.transmissions[header.transmissionId];
    }

    processIncomingMessage(message, rInfo) {
        const { header, data } = this.parseMessage(message);
        switch (header.flag) {
            case flags.ack: {
                this.processAckMessage({ header, data, rInfo });
                break;
            }
            case flags.requestForPacket: {
                break;
            }

            case flags.end: {
                this.processEndMessage({ header, data, rInfo });
                break;
            }

            case flags.connect: {
                this.emit("connection_established");
                break;
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
        const dataBuffer = Buffer.from(data ? data.data : []);
        return {
            header,
            data: dataBuffer,
        };
    }

    async #udpConnect() {
        return new Promise((resolve) => {
            this.client.on("connect", () => {
                return resolve();
            });
            this.client.connect(this.port, this.host);
        });
    }
    async connect() {
        await this.#udpConnect();
        return new Promise((resolve) => {
            this.isConnecting = true;
            this.client.send(
                JSON.stringify({
                    header: {
                        flag: flags.connect,
                    },
                })
            );
            this.once("connection_established", () => {
                this.isConnected = true;
                resolve();
            });
        });
    }

    sendMessage(data) {
        if (!this.isConnected) throw new Error("not connected");
        // process data
        const buffer = Buffer.from(data);
        const array = splitBuffer(buffer);
        const { messagingCycle, finish, transmissionId, totalLength } =
            buildPackets(array);
        this.transmissions[transmissionId] = {
            totalLength,
            acks: {},
        };
        messagingCycle.forEach((item) => {
            this.transmissions[transmissionId].acks[
                item.header.packetNumber
            ] = false;
        });
        for (const item of messagingCycle) {
            this.client.send(JSON.stringify(item));
        }
    }

    buildAcknowledgmentPacket({ transmissionId, packetNumber }) {
        return {
            header: {
                flag: flags.ack,
                packetNumber: packetNumber,
                transmissionId,
                type: types.ack,
            },
            data: Buffer.from([]),
        };
    }
}
