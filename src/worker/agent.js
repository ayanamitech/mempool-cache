const crypto = require('crypto');
const { fetch } = require('./fetch');

/**
  Fetch popular user agents and return random user agent to use.
**/
const fetchAgent = async (config) => {
  const url = config.API['User-Agent'];
  const agentList = await fetch({ url, config });
  if (agentList === undefined) {
    console.error(`Could not fetch user-agent list from ${url}`);
    return;
  }
  const randomAgent = agentList[crypto.randomInt(0, agentList.length -1)];
  return randomAgent;
};

module.exports = fetchAgent;
