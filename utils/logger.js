const log = (msg) => console.log(`[${new Date().toLocaleString()}] ${msg}`);

module.exports = {
  info: (msg) => log(`[\x1b[32mINFO\x1b[0m] ${msg}`),
  error: (msg) => log(`[\x1b[31mERROR\x1b[0m] ${msg}`),
};
