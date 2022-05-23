const syncMempool = require('./mempool');
const syncLiquid = require('./liquid');

const Worker = (config) => {
  syncMempool(config);
  syncLiquid(config);
  setInterval(() => syncMempool(config), config.runEverySec * 1000);
  setInterval(() => syncLiquid(config), config.runEverySec * 1000);
}

module.exports = Worker;
