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
