const process = require('process');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(process.cwd(), 'public');

const cors = () => {
  return (req, callback) => {
    const corsOptions = {
      origin: req.headers.origin || '*',
      credentials: true,
      methods: ['GET, POST, OPTIONS'],
      headers: ['DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type']
    };
    callback(null, corsOptions);
  };
};

const donations = (req, reply) => {
  try {
    const donationsJson = JSON.parse(fs.readFileSync(path.join(publicDir, 'donations/donations.json'), { encoding: 'utf8' }));
    reply.send(donationsJson);
  } catch (e) {
    const errorMessage = (e instanceof Error) ? e.message : e;
    reply.code(400).send({error: `${errorMessage}`});
  }
};

const contributors =  (req, reply) => {
  try {
    const contributorsJson = JSON.parse(fs.readFileSync(path.join(publicDir, 'contributors/contributors.json'), { encoding: 'utf8' }));
    reply.send(contributorsJson);
  } catch (e) {
    const errorMessage = (e instanceof Error) ? e.message : e;
    reply.code(400).send({error: `${errorMessage}`});
  }
};

const translators = (req, reply) => {
  try {
    const translatorsJson = JSON.parse(fs.readFileSync(path.join(publicDir, 'translators/translators.json'), { encoding: 'utf8' }));
    const recoverObject = translatorsJson.reduce((acc, {language,contributor}) => (acc[language] = contributor, acc), {});
    reply.send(recoverObject);
  } catch (e) {
    const errorMessage = (e instanceof Error) ? e.message : e;
    reply.code(400).send({error: `${errorMessage}`});
  }
};

const assets_featured = (req, reply) => {
  try {
    const assetsJson = JSON.parse(fs.readFileSync(path.join(publicDir, 'assets/assets.json'), { encoding: 'utf8' }));
    reply.send(assetsJson);
  } catch (e) {
    const errorMessage = (e instanceof Error) ? e.message : e;
    reply.code(400).send({error: `${errorMessage}`});
  }
};

const assets_group = (req, reply) => {
  try {
    const assetsJson = JSON.parse(fs.readFileSync(path.join(publicDir, 'assets/assets.json'), { encoding: 'utf8' }));
    const asset = assetsJson.find(a => a.id === parseInt(req.params.id));
    reply.send(asset);
  } catch (e) {
    const errorMessage = (e instanceof Error) ? e.message : e;
    reply.code(400).send({error: `${errorMessage}`});
  }
};

module.exports = {
  cors,
  donations,
  contributors,
  translators,
  assets_featured,
  assets_group
};
