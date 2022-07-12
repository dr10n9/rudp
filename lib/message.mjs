import { flags, splitBuffer } from "./utils.mjs";

export class Message {
    #data;
    // validate
    constructor(transmissionId, data = [], isAck = true) {
        this.#data = Buffer.from(data);
        this.packets = {};
        this.isAck = isAck;
        this.transmissionId = transmissionId;
    }

    get data() {
        return this.#data.toString(); // from buffer
    }

    addData(index, data) {
        this.packets[index] = data;
        const fullData = Buffer.concat(Object.values(this.packets));
        this.#data = fullData;
    }

    getSplittedData() {
        return splitBuffer(this.#data);
    }

    // build packets
    buildPackets() {
        const totalLength = this.#data.length;
        const header = {
            totalLength,
            flag: this.isAck ? flags.ack : flags.noack,
            transmissionId: this.transmissionId,
        };

        return this.getSplittedData().map((item, index) => {
            const packetHeader = {
                ...header,
                packetNumber: index,
            };

            return {
                header: packetHeader,
                data: item,
            };
        });
    }
}

const message = new Message();
message.addData(0, Buffer.from("a"));
message.addData(1, Buffer.from("b"));
message.addData(2, Buffer.from("c"));

const packets = message.buildPackets();

console.log(packets);
