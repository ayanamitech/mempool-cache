const agent = require('./agent');
const syncMempool = require('./mempool');
const syncLiquid = require('./liquid');

const Worker = async (config) => {
  console.log('Initializing Mempool Cache Worker...');
  // Use popular user-agent for clearnet connection
  if (config.SOCKS5PROXY.ENABLED !== true) {
    config['User-Agent'] = await agent(config);
  }
  await syncMempool(config);
  await syncLiquid(config);
  setInterval(() => syncMempool(config), config.runEverySec * 1000);
  setInterval(() => syncLiquid(config), config.runEverySec * 1000);
};

module.exports = Worker;
