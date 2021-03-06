const { loadConfig } = require('use-config-json');

const defaultConfig = {
  'port': 3300,
  'listen': '127.0.0.1',
  'runEverySec': 3600,
  'cache': {
    'donations': true,
    'contributors': true,
    'translators': true,
    'liquid': true
  },
  'fetch': {
    'concurrency': 1,
    'intervalCap': 25,
    'intervalSec': 60,
    'retry': 5,
    'retryOnSec': 60
  },
  'API': {
    'User-Agent': 'https://raw.githubusercontent.com/Kikobeats/top-user-agents/master/index.json',
    'mempool': 'https://mempool.space/api/v1',
    'mempool_onion': 'http://mempoolhqx4isw62xs7abwphsq7ldayuidyx2v2oethdhhj6mlo2r6ad.onion/api/v1',
    'liquid': 'https://liquid.network/api/v1',
    'liquid_onion': 'http://liquidmom47f6s3m53ebfxn47p76a6tlnxib3wp6deux7wuzotdr6cyd.onion/api/v1'
  },
  'SOCKS5PROXY': {
    'ENABLED': false,
    'ONION': false,
    'HOST': '127.0.0.1',
    'PORT': 9050,
    'USERNAME': '',
    'PASSWORD': ''
  }
};

module.exports = loadConfig(defaultConfig);
