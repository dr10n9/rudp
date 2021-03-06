import { EventEmitter } from "node:events";
import dgram from "node:dgram";

import { flags } from "./utils.mjs";
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

        this.server.on("connect", (socket) => {
            console.log(socket);
        });
    }

    processPacket({ header, data, rInfo }) {
        if (!this.transmissions[header.transmissionId]) {
            this.transmissions[header.transmissionId] = {
                data: {},
                receivedFinal: false,
                isAck: header.flag ===flags.ack,
            };
        }
        if (header.flag === flags.ack || header.flag === flags.noack) {
            this.transmissions[header.transmissionId].data[
                header.packetNumber
            ] = data;
            // add acknowledgment
        }

        if (header.flag === flags.end) {
            const finalData = [];
            for (let i = 0; i < header.packetNumber - 1; i++) {
                finalData.push(
                    this.transmissions[header.transmissionId].data[i]
                );
            }

            this.emit("message", Buffer.concat(finalData), rInfo);
        }
    }
}
