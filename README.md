# Reliable UDP

uses node:dgram


ROADMAP:
- [ ] describe header structure
- [ ] implement connection abstraction
- [x] implement data split into packets ({header, data})
- [ ] implement ack
- [ ] add option to disable ack
- [ ] implement client/server
- [ ] load testing

### Flags
```javascript
const flags = {
    init: 0,
    ack: 1,
    noack: 2,
    end: 3,
    connect: 4,
    disconnect: 5,
    requestForPacket: 6,
};
```
init - start messaging cycle  
end - end messaging cycle  
ack/noack - enable/disable acknowledgment  
connect/disconnect - connection abstraction  
requestForPacket - request sender for missing packet  

## server
extends EventEmitter
this.server = udp server
this.transmissions = {};

## for client and server
on udp message
check transmission map
if no transmission with id => add
if exists => add packet
when message is completed => emit message event for server class


## connection
client sends packet with connect flag
receives connect accept
sends accept 
server emits connection event

## when client or server wants to send data message is built
message
has id
has data
has packets

getPackets(): Packet[]
addPacket(packet: Packet) {
    add packet by id
}


packet
has header
has data
has status (acked/unacked)

when all packets are acked => message sending is completed


message receiving
init (with transmission id)
create transmission {[id: string]: message: Message}
on packet with ack/noack flag add packets to message with transmission id
after receiving finished (all packets acked and packet with end received) concat packet data (buffers) and emit message event

header structure
flag 1 byte
transmission id 
packet number 