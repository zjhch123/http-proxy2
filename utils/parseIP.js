const net = require('net');

module.exports = function (ipPort) {
  const sliceIndex = ipPort.lastIndexOf(':');
  const serverIP = ipPort.slice(0, sliceIndex).trim();
  const serverPort = Number(ipPort.slice(sliceIndex + 1).trim());

  if (net.isIP(serverIP) === 0) {
    throw new Error(`IP is invalid, ${serverIP}`);
  }

  if (isNaN(serverPort) || serverPort < 1 || serverPort > 65535) {
    throw new Error(`port is invalid, ${serverPort}`);
  }

  return {
    serverIP,
    serverPort,
  };
};
