const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');
const sharp = require('sharp');

const fs = require('fs');
// Create promise for write stream
const stream = require('stream');
const util = require('util');
const finished = util.promisify(stream.finished);

const { setDelay, writeFailedLog, getProtocol } = require('../lib');

/**
  Fetch module with retry & error logging support

  Written by AyanamiTech @ May 18th, 2022

  @param {string} url - URL to make GET request
  @param {object} config - Config file parsed from config.json
  @param {object} options - Pre defined Axios options, useful for fetching images.
  @returns {(AxiosResponse | undefined)}
**/
const fetch = async ({ url, config, options }) => {
  const axiosOptions = options ? options : {};
  let retry = 0;

  if (config === undefined) {
    throw new Error ('Config required');
  }

  // Default to GET request if URL is defined but axiosOptions.url is undefined
  if (url && axiosOptions.url === undefined) {
    axiosOptions.method = 'get';
    axiosOptions.url = url;
  }

  if (config.SOCKS5PROXY.ENABLED) {
    const socksOptions = {
      agentOptions: {
        keepAlive: true,
      },
      hostname: config.SOCKS5PROXY.HOST,
      port: config.SOCKS5PROXY.PORT
    };

    if (config.SOCKS5PROXY.USERNAME && config.SOCKS5PROXY.PASSWORD) {
      socksOptions.username = config.SOCKS5PROXY.USERNAME;
      socksOptions.password = config.SOCKS5PROXY.PASSWORD;
    }

    // Handle proxy agent for onion addresses
    if (getProtocol(url) === 'http') {
      axiosOptions.httpAgent = new SocksProxyAgent(socksOptions);
    } else {
      axiosOptions.httpsAgent = new SocksProxyAgent(socksOptions);
    }
  }

  // Using Tor Browser's raw User-Agent as a default
  const userAgent = (config['User-Agent']) ? config['User-Agent'] : 'Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0';
  axiosOptions.headers = {
    'User-Agent': userAgent
  }

  while (retry < config.retryFetch) {
    try {
      const data = await axios(axiosOptions);
      if (data.statusText === 'error' || data.data === undefined) {
        throw new Error(`Could not fetch data from ${url}, Error: ${data.status}`);
      }
      if (data.config) {
        const agent = data.config.headers?.['User-Agent'];
        console.log(`Sending ${data.config.method?.toUpperCase()} request to ${data.config.url} using Agent ${agent}`);
      }
      return data.data;
    } catch (e) {
      const date = new Date();
      console.error(e);
      if (e.response?.config?.url && e.response?.status && e.response?.statusText) {
        console.error(`Request to ${e.response.config.url} failed with code ${e.response.status}`);
        console.error(`Error message: ${e.response.statusText}`);
        writeFailedLog(new Error(`Request to ${e.response.config.url} failed with code ${e.response.status}`), date);
        writeFailedLog(new Error(`Error message: ${e.response.statusText}`), date);
      }
      writeFailedLog(e, date);
      retry++;
    }
    await setDelay(config.retryFetchOnSec);
  }
  return;
}

const fetchImages = async (url, path, config) => {
  try {
    const axiosOptions = {
      url,
      method: 'get',
      responseType: 'stream',
      timeout: 10000
    }
    const writer = fs.createWriteStream(path);
    // Save to WebP format
    const convertWebp = sharp().toFormat('webp').webp({nearLossless:true});
    const stream = await fetch({ config, options: axiosOptions });
    if (stream === undefined) {
      throw new Error(`Failed to receive stream data for ${path}`);
    }
    stream.pipe(convertWebp).pipe(writer);
    await finished(writer);
  } catch (e) {
    const date = new Date();
    console.error(`Failed to write stream data for ${path}`);
    console.error(e);
    writeFailedLog(new Error(`Failed to write stream data for ${path}`), date);
    writeFailedLog(e, date);
  }
}

module.exports = {
  fetch,
  fetchImages
};
