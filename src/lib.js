const process = require('process');
const path = require('path');
const fs = require('fs');
const assert = require('assert').strict;

const setDelay = (secs = 1) => new Promise(resolve => setTimeout(() => resolve(), secs * 1000));

const setSafeInterval = (func, interval) => {
  func()
    .catch(console.error)
    .finally(() => {
      setTimeout(() => setSafeInterval(func, interval), interval)
    });
}

const getLogName = (timestamp) => {
  try {
    let logNumber = 0;
    while (fs.existsSync(path.join(process.cwd(), `./log/${timestamp}_${logNumber}.txt`))) {
      logNumber++;
    }
    return `./log/${timestamp}_${logNumber}.txt`;
  } catch (e) {
    console.error(`Failed to get number for ${timestamp} log, default to 0`);
    console.log(e);
    return `./log/${timestamp}_0.txt`;
  }
}

const writeFailedLog = (faillog, time) => {
  const timestamp = (time instanceof Date) ? time.getTime() : new Date().getTime();
  const fileName = getLogName(timestamp);
  try {
    const parseError = (faillog instanceof Error) ? faillog.message : faillog;
    fs.writeFileSync(path.join(process.cwd(), fileName), parseError, { encoding: 'utf8' });
  } catch (e) {
    console.error(`Failed to write error log as ${fileName}`);
    console.log(e);
  }
}

const getFailedLogs = () => {
  const logPath = path.join(process.cwd(), './log');
  try {
    if (!fs.existsSync(logPath)) {
      console.error('No logs!');
      return {
        count: 0,
        logs: {}
      }
    }
    let logList = fs.readdirSync(logPath);
    // Exclude .gitignore
    logList = logList.filter(l => l !== '.gitignore');
    // Create new logCount array
    let logCount = logList.map(l => l.split('_')[0]);
    logCount = logCount.filter((c, index) => logCount.indexOf(c) === index);
    const logs = logCount.map(l => {
      const errorList = logList.filter(e => e.split('_')[0] === l).map(e => JSON.parse(fs.readFileSync(path.join(logPath, e), { encoding: 'utf8' })));
      return {
        timestamp: l,
        errorList
      };
    });

    return {
      count: logCount.length,
      logs
    }
  } catch (e) {
    console.log(`Failed to get failed logs from ${logPath}`);
    console.error(e);
  }
}

const getProtocol = (url) => new URL(url).protocol.split(':')[0];

const useOnionAddress = (name, config) => ((config.SOCKS5PROXY.ENABLED === true) && (config.SOCKS5PROXY.ONION === true) && config.API[`${name}_onion`]) ? config.API[`${name}_onion`] : config.API[`${name}`];

const compareArray = (array1, array2) => {
  try {
    assert.deepStrictEqual(array1, array2);
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = {
  setDelay,
  setSafeInterval,
  writeFailedLog,
  getFailedLogs,
  getProtocol,
  useOnionAddress,
  compareArray
}
