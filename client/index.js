const net = require('net');
const logger = require('../utils/logger');

const local_host = '127.0.0.1';
/*
const config = {
  remoteServer: '127.0.0.1',
  remotePort: 9999,
}

const services = {
  http: {
    remote_port: 3333,
    local_port: 8000,
  },
  ssh: {
    remote_port: 4444,
    local_port: 22,
  }
};
*/

const startClient = ({
  config,
  services,
}) => {
  let client;

  function createConnection () {
    logger.info(`客户端已就绪, 开始连接服务端, ip: ${config.remoteServer}`);
    client = net.createConnection({
      host: config.remoteServer,
      port: config.remotePort,
    }, () => {
      client.write(JSON.stringify({ message: 'register', services }));
    });

    client.on('data', (data) => {
      try {
        data = JSON.parse(data);

        const { message } = data;

        if (message === 'register') {
          logger.info('连接服务端成功');
        } else if (message === 'connect') {
          const { proxySocketId, remote_port, local_port } = data;
          const serverSocket = new net.Socket();
          const clientSocket = new net.Socket();

          serverSocket.connect(config.remotePort, config.remoteServer, () => {
            serverSocket.write(JSON.stringify({ message: 'connect', proxySocketId }));
            clientSocket.connect(local_port, local_host);
            clientSocket.pipe(serverSocket);
            serverSocket.pipe(clientSocket);

            clientSocket.on('end', () => serverSocket.end());
            clientSocket.on('error', () => serverSocket.end());
            logger.info(`隧道建立完成, ${config.remoteServer}:${remote_port} <==> ${local_host}:${local_port}`);
          });

          serverSocket.on('end', () => clientSocket.end());
          serverSocket.on('error', () => clientSocket.end());
        }
        return;
      } catch (e) {
        // Nothing to do
      }
      client.end();
    });

    client.on('error', (e) => {
      logger.error(e.message);
    });
    client.on('end', () => {
      logger.info('从远程服务器断开连接');
    });
  }

  createConnection();

  setInterval(() => {
    if (client && client.readyState === 'closed') {
      client.end();
      logger.info('尝试重新连接远程服务器');
      createConnection();
    }
  }, 2000);
};

module.exports = ({
  remoteServer,
  services,
}) => {
  const config = {
    remoteServer,
    remotePort: 9999,
  };

  startClient({ config, services });
};
