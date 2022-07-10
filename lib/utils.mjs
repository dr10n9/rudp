import * as uuid from 'uuid'

/**
 * @param {Buffer} buffer 
 * @returns {Buffer[]}
 */
export function splitBuffer(buffer) {
    let start = 0;
    const result = []
    while (start < buffer.length) {
        const part = buffer.subarray(start, start + MAX_MESSAGE_SIZE);
        result.push(part);
        start += MAX_MESSAGE_SIZE;
    }

    return result
}


/**
 * 
 * @param {Buffer[]} messages 
 */
export function buildPackets(packets = []) {
    const totalLength = packets.reduce((prev, cur) => prev + cur.length, 0)
    const transmissionId = uuid.v4()
    const messagingCycle = packets.map((packet, index) => {
        return {
            header : {
                flag : flags.ack,
                packetNumber : index,
                totalMessageLength : totalLength,
                transmissionId
            },
            data : packet
        }
    });
    const finish = {
        header : {
            flag : flags.end,
            packetNumber : messagingCycle.length,
            transmissionId,
            totalMessageLength : totalLength
        }
    }

    return {
        messagingCycle,
        finish
    }
}

export const flags = {
    init : 0,
    ack : 1,
    noack : 2,
    end : 3,
    connect : 4,
    disconnect : 5
};

export const MAX_MESSAGE_SIZE = 1;

export function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}