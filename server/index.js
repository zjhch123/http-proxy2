const net = require('net');
const logger = require('../utils/logger');

const clientSockets = {};
const proxySockets = {};
const proxyServices = {}; // 记录所有需要转发的服务

const startProxyServer = ({
  serviceName,
  clientSocketId,
  remote_port,
  local_port,
}) => {
  const proxyServer = net.createServer((proxySocket) => {
    if (!clientSockets[clientSocketId]) { proxySocket.end(); }

    const proxySocketId = [proxySocket.remoteAddress, proxySocket.remoteFamily, proxySocket.remotePort].join("_");
    proxySockets[proxySocketId] = { proxy: proxySocket, client: null };
    clientSockets[clientSocketId].write(JSON.stringify({ proxySocketId, message: 'connect', remote_port, local_port }));

    proxySocket.on('error', () => proxySocket.end())
    proxySocket.on('end', () => {
      if (proxySockets[proxySocketId]) {
        proxySockets[proxySocketId].proxy && proxySockets[proxySocketId].proxy.end()
        proxySockets[proxySocketId].client && proxySockets[proxySocketId].client.end()
        delete proxySockets[proxySocketId]
      }
    });
  });

  proxyServer.listen(remote_port, '0.0.0.0', () => {
    logger.info(`转发服务: ${serviceName} 启动成功, local: ${remote_port} <==> ${local_port} :remote`);
  });

  return proxyServer;
}

const startServer = () => {
  const server = net.createServer((socket) => {
    const id = [socket.remoteAddress, socket.remoteFamily, socket.remotePort].join("_");
    if (!clientSockets[id]) {
      clientSockets[id] = socket;
  
      socket.on('data', (data) => {
        try {
          try {
            data = JSON.parse(data);
          } catch (e) {
            return
          }
  
          logger.info(`客户端连接成功, ${id}`);
          const { message } = data;
  
          if (message === 'register') {
            const { services } = data;
  
            for (let serviceName in services) {
              if (!proxyServices[serviceName]) {
                const service = services[serviceName];
                service.serviceName = serviceName;
                service.clientSocket = socket;
                service.clientSocketId = id;
                service.proxyServer = startProxyServer(service);
                proxyServices[serviceName] = service;
              }
            }
            return socket.write(JSON.stringify({ message: 'register' }));
          } else if (message === 'connect') {
            const { proxySocketId } = data;
            if (proxySockets && proxySockets[proxySocketId].proxy && !proxySockets[proxySocketId].client) {
              const proxySocket = proxySockets[proxySocketId];
  
              proxySocket.client = socket;
              proxySocket.client.pipe(proxySocket.proxy);
              proxySocket.proxy.pipe(proxySocket.client);
              return;
            }
          }
        } catch (e) {
  
        }
        socket.end();
      });
  
      socket.on('error', () => {
        socket.end();
      });
  
      socket.on('end', () => {
        for (let serviceName in proxyServices) {
          const service = proxyServices[serviceName]
          const { proxyServer, clientSocketId } = service
          if (clientSocketId === id) {
            proxyServer.close()
            logger.info(`转发: ${serviceName} 已关闭`)
            delete proxyServices[serviceName]
          }
        }
  
        clientSockets[id].end()
        delete clientSockets[id]
        logger.info(`客户端: ${id} 已断开连接`)
      });
    }
  });
  
  server.listen(9999, '0.0.0.0', () => {
    logger.info('等待客户端连接');
  });
}

module.exports = startServer
