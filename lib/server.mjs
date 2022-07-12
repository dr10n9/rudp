import { EventEmitter } from "node:events";
import dgram from "node:dgram";

import { flags, types } from "./utils.mjs";

class Connection extends EventEmitter {
    constructor(address, port) {
        super();
        this.address = address;
        this.port = port;
        this.server = null;
    }

    sendMessage(data) {
        const buffer = Buffer.from(data);
        const array = splitBuffer(buffer);
        const { messagingCycle, finish, transmissionId, totalLength } =
            buildPackets(array);
        this.server.transmissions[transmissionId] = {
            totalLength,
            acks: {},
        };
        messagingCycle.forEach((item) => {
            this.server.transmissions[transmissionId].acks[
                item.header.packetNumber
            ] = false;
        });
        for (const item of messagingCycle) {
            this.client.send(JSON.stringify(item));
        }
    }
}

export class Server extends EventEmitter {
    constructor(host, port) {
        super();
        const server = dgram.createSocket("udp4");
        server.bind(port, host);
        this.server = server;

        this.server.on("connect", () => {
            console.log("new connection");
        });

        this.transmissions = {};
        this.server.on("message", (data, rInfo) => {
            const stringified = data.toString();
            const json = JSON.parse(stringified);
            const packetHeader = json.header;
            const packetData = json.data ? Buffer.from(json.data.data) : {};
            this.processPacket({
                header: packetHeader,
                data: packetData,
                rInfo,
            });
        });

        this.connections = {};
    }

    processConnection({ header, data, rInfo }) {
        this.server.send(
            JSON.stringify({
                header: {
                    flag: flags.connect,
                },
                data: Buffer.from([]),
            }),
            rInfo.port,
            rInfo.address
        );
        const connection = new Connection(rInfo.address, rInfo.port);
        connection.server = this.server;
        this.connections[`${rInfo.address}${rInfo.port}`] = connection;
        this.emit("newConnection", connection);
    }

    processPacket({ header, data, rInfo }) {
        if (header.flag === flags.connect)
            return this.processConnection({ header, data, rInfo });
        if (!this.transmissions[header.transmissionId]) {
            this.transmissions[header.transmissionId] = {
                data: {},
                receivedFinal: false,
                isAck: header.flag === flags.ack,
            };
        }
        if (header.flag === flags.ack || header.flag === flags.noack) {
            this.processAckMessage({ header, data, rInfo });
        }

        if (header.flag === flags.end) {
            this.processEndMessage({ header, data, rInfo });
        }
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
            this.transmissions[header.transmissionId].data[
                header.packetNumber
            ] = data;
            if (header.flag === flags.ack) {
                const packet = this.buildAcknowledgmentPacket(header);
                this.server.send(
                    JSON.stringify(packet),
                    rInfo.port,
                    rInfo.address
                );
            }
        }
    }

    processEndMessage({ header, data, rInfo }) {
        const finalData = [];
        for (let i = 0; i < header.packetNumber - 1; i++) {
            finalData.push(this.transmissions[header.transmissionId].data[i]);
        }
        this.connections[`${rInfo.address}${rInfo.port}`].emit(
            "message",
            Buffer.concat(finalData)
        );
        delete this.transmissions[header.transmissionId];
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
