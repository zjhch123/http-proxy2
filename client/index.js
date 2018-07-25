const http = require('http')
const net = require('net')
const PacketHub = require('./PacketHub3')
const util = require('./util')
const requests = require('./requests')
const Emit = require('./EventEmit')

const startClient = (publicIP = '127.0.0.1', proxyToPort = 80) => {
  const packetHub = new PacketHub()

  const HOST = publicIP;
  const PORT = 9999;

  const client = new net.Socket();

  client.connect(PORT, HOST, () => {
    console.log(`与服务端: ${publicIP} 连接成功, 开始转发请求到本地${proxyToPort}端口`)
    packetHub.startListen()
  })

  client.on('data', (data) => {
    packetHub.push(data)
  })

  client.on('close', () => {
    console.log('与服务端的连接被中断!')
    packetHub.clear()
  })

  Emit.on('fullpacket', async (key, fullPacket) => {
    const {
      method, path, headers, body
    } = util.splitRequest(fullPacket)
    console.log(`[${util.getNowDate()}] ${method} - ${path}`)
    const result = await requests({ host: '127.0.0.1', port: proxyToPort, path, method, headers, body })
    client.write(util.createWrappedBuf(key, result))
  })
}

module.exports = startClient