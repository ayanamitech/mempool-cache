const process = require('process');
const path = require('path');
const fs = require('fs');
const { PQueue } = require('p-queue-cjs');

const { fetch, fetchImages } = require('./fetch');
const { writeFailedLog, useOnionAddress, compareArray } = require('../lib');

const syncDonations = async (config) => {
  try {
    const donationsJson = path.join(config.publicDir, './donations/donations.json');
    const newDonations = await fetch({ url: `${config.mempool}/donations`, config });
    if (newDonations === undefined) {
      throw new Error(`Failed to fetch latest donations data from ${config.mempool}/donations`);
    }
    let donationsQueue = newDonations;

    // If previously synced data exists, filter them
    if (fs.existsSync(donationsJson)) {
      const existingDonations = JSON.parse(fs.readFileSync(donationsJson, { encoding: 'utf8' }));
      if (compareArray(newDonations, existingDonations)) {
        console.log('Donations data is identical, no need to sync');
        return {
          donations: newDonations,
          donationsQueue: []
        };
      }
      // https://stackoverflow.com/questions/21987909/how-to-get-the-difference-between-two-arrays-of-objects-in-javascript
      donationsQueue = donationsQueue.filter(({ imageUrl: id1 }) => !existingDonations.some(({ imageUrl: id2 }) => id2 === id1));
      if (donationsQueue.length === 0) {
        console.log('Donations data is identical, no need to sync');
        return {
          donations: newDonations,
          donationsQueue: []
        };
      }
      console.log(`Donations to update: ${donationsQueue.length}`);
    }
    donationsQueue = donationsQueue.map(d => {
      const filePath = path.join(config.publicDir, `./donations/images/${d.handle}`);
      return () => fetchImages(`${config.mempool}/donations/images/${d.handle}`, filePath, config);
    });
    return {
      donations: newDonations,
      donationsQueue,
    };
  } catch (e) {
    const date = new Date();
    console.error('Error while syncing donations from mempool');
    console.error(e);
    writeFailedLog(new Error('Error while syncing donations from mempool'), date);
    writeFailedLog(e, date);
    return {
      donations: [],
      donationsQueue: []
    }
  }
};

const syncContributors = async (config) => {
  try {
    const contributorsJson = path.join(config.publicDir, './contributors/contributors.json');
    const newContributors = await fetch({ url: `${config.mempool}/contributors`, config });
    if (newContributors === undefined) {
      throw new Error(`Failed to fetch latest contributors data from ${config.mempool}/contributors`);
    }
    let contributorsQueue = newContributors;

    // If previously synced data exists, filter them
    if (fs.existsSync(contributorsJson)) {
      const existingContributors = JSON.parse(fs.readFileSync(contributorsJson, { encoding: 'utf8' }));
      if (compareArray(newContributors, existingContributors)) {
        console.log('Contributors data is identical, no need to sync');
        return {
          contributors: newContributors,
          contributorsQueue: []
        };
      }
      // https://stackoverflow.com/questions/21987909/how-to-get-the-difference-between-two-arrays-of-objects-in-javascript
      contributorsQueue = contributorsQueue.filter(({ id: id1 }) => !existingContributors.some(({ id: id2 }) => id2 === id1));
      if (contributorsQueue.length === 0) {
        console.log('Contributors data is identical, no need to sync');
        return {
          contributors: newContributors,
          contributorsQueue: []
        };
      }
      console.log(`Contributors to update: ${contributorsQueue.length}`);
    }
    contributorsQueue = contributorsQueue.map(d => {
      const filePath = path.join(config.publicDir, `./contributors/images/${d.id}`);
      return () => fetchImages(`${config.mempool}/contributors/images/${d.id}`, filePath, config);
    });
    return {
      contributors: newContributors,
      contributorsQueue,
    };
  } catch (e) {
    const date = new Date();
    console.error('Error while syncing contributors from mempool');
    console.error(e);
    writeFailedLog(new Error('Error while syncing contributors from mempool'), date);
    writeFailedLog(e, date);
    return {
      contributors: [],
      contributorsQueue: []
    }
  }
};

const syncTranslators = async (config) => {
  try {
    const translatorsJson = path.join(config.publicDir, './translators/translators.json');
    let newTranslators = await fetch({ url: `${config.mempool}/translators`, config });
    if (newTranslators === undefined) {
      throw new Error(`Failed to fetch latest translators data from ${config.mempool}/translators`);
    }
    // Change translator object to array
    // Should recover original object with newTranslators.reduce((acc, {language,contributor}) => (acc[language] = contributor, acc), {});
    newTranslators = Object.entries(newTranslators).map(([language, contributor]) => ({language, contributor}));
    let translatorsQueue = newTranslators;

    // If previously synced data exists, filter them
    if (fs.existsSync(translatorsJson)) {
      const existingTranslators = JSON.parse(fs.readFileSync(translatorsJson, { encoding: 'utf8' }));
      if (compareArray(newTranslators, existingTranslators)) {
        console.log('Translators data is identical, no need to sync');
        return {
          translators: newTranslators,
          translatorsQueue: []
        };
      }
      // https://stackoverflow.com/questions/21987909/how-to-get-the-difference-between-two-arrays-of-objects-in-javascript
      translatorsQueue = translatorsQueue.filter(({ contributor: id1 }) => !existingTranslators.some(({ contributor: id2 }) => id2 === id1));
      if (translatorsQueue.length === 0) {
        console.log('Translators data is identical, no need to sync');
        return {
          translators: newTranslators,
          translatorsQueue: []
        };
      }
      console.log(`Translators to update: ${translatorsQueue.length}`);
    }
    translatorsQueue = translatorsQueue.map(d => {
      const filePath = path.join(config.publicDir, `./translators/images/${d.contributor}`);
      return () => fetchImages(`${config.mempool}/translators/images/${d.contributor}`, filePath, config);
    });
    return {
      translators: newTranslators,
      translatorsQueue,
    };
  } catch (e) {
    const date = new Date();
    console.error('Error while syncing translators from mempool');
    console.error(e);
    writeFailedLog(new Error('Error while syncing translators from mempool'), date);
    writeFailedLog(e, date);
    return {
      translators: [],
      translatorsQueue: []
    }
  }
};

/**
  Load list of images from public/donations/images directory, filter with server data and return async functions to resync missing files.
**/
const checkDonations = (donations, config) => {
  try {
    const localFiles = fs.readdirSync(path.join(config.publicDir, './donations/images'));
    let missingFiles = donations.filter(({ handle }) => !localFiles.some(f => f === handle));
    if (missingFiles.length === 0) {
      fs.writeFileSync(path.join(config.publicDir, './donations/donations.json'), JSON.stringify(donations, null, 2), { encoding: 'utf8' });
      console.log('Local Donations files are identical');
      return [];
    }
    missingFiles.map(f => console.log(`Missing ${f.handle} for donations, will resync as soon as possible`));
    missingFiles = missingFiles.map(f => {
      const filePath = path.join(config.publicDir, `./donations/images/${f.handle}`);
      return () => fetchImages(`${config.mempool}/donations/images/${f.handle}`, filePath, config);
    });
    return missingFiles;
  } catch (e) {
    // Catching Error when parsing local files causing panic
    const date = new Date();
    console.error('Could not load local donations');
    console.error(e);
    writeFailedLog(new Error('Could not load local donations'), date);
    writeFailedLog(e, date);
    return donations.map(f => {
      const filePath = path.join(config.publicDir, `./donations/images/${f.handle}`);
      return () => fetchImages(`${config.mempool}/donations/images/${f.handle}`, filePath, config);
    });
  }
};

const checkContributors = (contributors, config) => {
  try {
    const localFiles = fs.readdirSync(path.join(config.publicDir, './contributors/images')).map(f => parseInt(f));
    let missingFiles = contributors.filter(({ id }) => !localFiles.some(f => f === id));
    if (missingFiles.length === 0) {
      fs.writeFileSync(path.join(config.publicDir, './contributors/contributors.json'), JSON.stringify(contributors, null, 2), { encoding: 'utf8' });
      console.log('Local Contributors files are identical');
      return [];
    }
    missingFiles.map(f => console.log(`Missing ${f.id} for contributors, will resync as soon as possible`));
    missingFiles = missingFiles.map(f => {
      const filePath = path.join(config.publicDir, `./contributors/images/${f.id}`);
      return () => fetchImages(`${config.mempool}/contributors/images/${f.id}`, filePath, config);
    });
    return missingFiles;
  } catch (e) {
    // Catching Error when parsing local files causing panic
    const date = new Date();
    console.error('Could not load local contributors');
    console.error(e);
    writeFailedLog(new Error('Could not load local contributors'), date);
    writeFailedLog(e, date);
    return contributors.map(f => {
      const filePath = path.join(config.publicDir, `./contributors/images/${f.id}`);
      return () => fetchImages(`${config.mempool}/contributors/images/${f.id}`, filePath, config);
    });
  }
};

const checkTranslators = (translators, config) => {
  try {
    const localFiles = fs.readdirSync(path.join(config.publicDir, './translators/images'));
    let missingFiles = translators.filter(({ contributor }) => !localFiles.some(f => f === contributor));
    if (missingFiles.length === 0) {
      fs.writeFileSync(path.join(config.publicDir, './translators/translators.json'), JSON.stringify(translators, null, 2), { encoding: 'utf8' });
      console.log('Local Translators files are identical');
      return [];
    }
    missingFiles.map(f => console.log(`Missing ${f.contributor} for translators, will resync as soon as possible`));
    missingFiles = missingFiles.map(f => {
      const filePath = path.join(config.publicDir, `./translators/images/${f.contributor}`);
      return () => fetchImages(`${config.mempool}/translators/images/${f.contributor}`, filePath, config);
    });
    return missingFiles;
  } catch (e) {
    // Catching Error when parsing local files causing panic
    const date = new Date();
    console.error('Could not load local translators');
    console.error(e);
    writeFailedLog(new Error('Could not load local translators'), date);
    writeFailedLog(e, date);
    return translators.map(f => {
      const filePath = path.join(config.publicDir, `./translators/images/${f.contributor}`);
      return () => fetchImages(`${config.mempool}/translators/images/${f.contributor}`, filePath, config);
    });
  }
};

/**
  Audit and fix local cache
**/
const auditCache = (serverData, config) => {
  let totalQueue = [];
  if (config.cache.donations === true && serverData.donations.length > 0) {
    const donations = checkDonations(serverData.donations, config);
    totalQueue.push(...donations);
  }
  if (config.cache.contributors === true && serverData.contributors.length > 0) {
    const contributors = checkContributors(serverData.contributors, config);
    totalQueue.push(...contributors);
  }
  if (config.cache.translators === true && serverData.translators.length > 0) {
    const translators = checkTranslators(serverData.translators, config);
    totalQueue.push(...translators);
  }
  return totalQueue;
};

/**
  Sync static assets with mempool instance
**/
const syncMempool = async (config) => {
  config.publicDir = path.join(process.cwd(), 'public');
  config.mempool = useOnionAddress('mempool', config);
  const queue = new PQueue({ concurrency: config.concurrency, intervalCap: config.intervalCap, interval: config.intervalSec * 1000 });

  if (!fs.existsSync(path.join(config.publicDir, './donations/images'))) {
    fs.mkdirSync(path.join(config.publicDir, './donations/images'), { recursive: true });
  }
  if (!fs.existsSync(path.join(config.publicDir, './contributors/images'))) {
    fs.mkdirSync(path.join(config.publicDir, './contributors/images'), { recursive: true });
  }
  if (!fs.existsSync(path.join(config.publicDir, './translators/images'))) {
    fs.mkdirSync(path.join(config.publicDir, './translators/images'), { recursive: true });
  }

  let totalQueue = [];
  const serverData = {};
  let retry = 0;

  if (config.cache.donations === true) {
    const { donations, donationsQueue } = await syncDonations(config);
    totalQueue.push(...donationsQueue);
    serverData.donations = donations;
  }
  if (config.cache.contributors === true) {
    const { contributors, contributorsQueue } = await syncContributors(config);
    totalQueue.push(...contributorsQueue);
    serverData.contributors = contributors;
  }
  if (config.cache.translators === true) {
    const { translators, translatorsQueue } = await syncTranslators(config);
    totalQueue.push(...translatorsQueue);
    serverData.translators = translators;
  }

  while (totalQueue.length !== 0) {
    await queue.addAll(totalQueue);
    totalQueue = auditCache(serverData, config);
    retry++;
    if (retry > config.retryFetch) {
      break;
    }
  }

  console.log(`Synced static assets with ${config.mempool}`);
};

module.exports = syncMempool;
