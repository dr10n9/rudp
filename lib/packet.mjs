export class Packet {
    #header;
    #data;

    constructor(header, data) {
        this.#data = data;
        this.#header = header;
        this.isAcked = false;
    }

    get header() {
        return this.#header;
    }

    get data() {
        return this.#data;
    }

    ack() {
        this.isAcked = true;
    }
}
