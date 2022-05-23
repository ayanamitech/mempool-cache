const process = require('process');
const path = require('path');
const fs = require('fs');

const { fetch } = require('./fetch');
const { writeFailedLog, useOnionAddress, compareArray } = require('../lib');

/**
  Fetch latest assets JSON object from liquid.network
**/
const syncAssets = async (config) => {
  if (config.cache.liquid !== true) {
    return;
  }
  config.publicDir =  path.join(process.cwd(), 'public');
  config.liquid = useOnionAddress('liquid', config);

  if (!fs.existsSync(path.join(config.publicDir, './assets'))) {
    fs.mkdirSync(path.join(config.publicDir, './assets'), { recursive: true });
  }

  const assetsJson = path.join(config.publicDir, './assets/assets.json');
  const newAssets = await fetch({ url: `${config.liquid}/assets/featured`, config });
  if (newAssets === undefined) {
    const date = new Date();
    console.error(`Failed to fetch latest liquid assets data from ${config.liquid}/assets/featured`);
    writeFailedLog(new Error(`Failed to fetch latest liquid assets data from ${config.liquid}/assets/featured`), date);
    return;
  }
  // If previously synced data exists, filter them
  if (fs.existsSync(assetsJson)) {
    const existingAssets = JSON.parse(fs.readFileSync(assetsJson, { encoding: 'utf8' }));
    if (compareArray(newAssets, existingAssets)) {
      console.log('Assets data is identical, no need to sync');
      return;
    }
    // https://stackoverflow.com/questions/21987909/how-to-get-the-difference-between-two-arrays-of-objects-in-javascript
    const compareAssets = newAssets.filter(({ name: id1 }) => !existingAssets.some(({ name: id2 }) => id2 === id1));
    if (compareAssets.length === 0) {
      console.log('Assets data is identical, no need to sync');
      return;
    }
  }
  fs.writeFileSync(assetsJson, JSON.stringify(newAssets, null, 2), { encoding: 'utf8' });
  console.log(`Synced latest assets data from ${config.liquid}`);
};

module.exports = syncAssets;
