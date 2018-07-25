const Emit = require('../EventEmit/')

class PacketHub {
  constructor() {
    this.data = Buffer.alloc(0)
    this.intervalId = setInterval(() => {
      try {
        this.analyseFullPacket()
      } catch(e) {
        console.log(e)
      }
    }, 16)
  }

  push(buf) {
    this.data = Buffer.concat([this.data, buf])
  }

  toString() {
    return this.data.length
  }

  analyseFullPacket() {
    if (this.data.length < 16) { return }
    const nextPacketLength = this.data.readUIntBE(0, 8)
    console.log('next packet length: ', nextPacketLength)
    const nextPacketKey = this.data.readUIntBE(8, 8)
    if (`${nextPacketKey}`.length !== 7) {
      throw new Error('error! 起始位错误')
    }
    const packetBuffer = this.data.slice(16, nextPacketLength + 16)
    console.log('next packet buffer: ', packetBuffer.length)
    Emit.emit('fullpacket', nextPacketKey, packetBuffer)
    this.data = this.data.slice(16 + nextPacketLength)
  }
}

module.exports = PacketHub