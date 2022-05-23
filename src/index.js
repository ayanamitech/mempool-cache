const fastify = require('fastify');
const fastifyCors = require('@fastify/cors');
const fastifyStatic = require('@fastify/static');
const qs = require('qs');

const process = require('process');
const path = require('path');
const fs = require('fs');

const Worker = require('./worker');
const config = require('./config');

const MempoolCache = () => {
  Worker(config);
  const app = fastify({
    querystringParser: str => qs.parse(str)
  });
  const publicDir = path.join(process.cwd(), 'public');
  // Define CORS for requests from browser
  app.register(fastifyCors, () => {
    return (req, callback) => {
      const corsOptions = {
        origin: req.headers.origin || '*',
        credentials: true,
        methods: ['GET, POST, OPTIONS'],
        headers: ['DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type']
      };
      callback(null, corsOptions);
    }
  });
  // Serve static data files
  app.register(fastifyStatic, {
    root: publicDir
  });
  // Return donations.json object
  app.get('/donations', (req, reply) => {
    try {
      const donationsJson = JSON.parse(fs.readFileSync(path.join(publicDir, 'donations/donations.json'), { encoding: 'utf8' }));
      reply.send(donationsJson);
    } catch (e) {
      const errorMessage = (e instanceof Error) ? e.message : e;
      reply.code(400).send({error: `${errorMessage}`});
    }
  });
  // Return contributors.json object
  app.get('/contributors', (req, reply) => {
    try {
      const contributorsJson = JSON.parse(fs.readFileSync(path.join(publicDir, 'contributors/contributors.json'), { encoding: 'utf8' }));
      reply.send(contributorsJson);
    } catch (e) {
      const errorMessage = (e instanceof Error) ? e.message : e;
      reply.code(400).send({error: `${errorMessage}`});
    }
  });
  // Recover and return translators.json object
  app.get('/translators', (req, reply) => {
    try {
      const translatorsJson = JSON.parse(fs.readFileSync(path.join(publicDir, 'translators/translators.json'), { encoding: 'utf8' }));
      const recoverObject = translatorsJson.reduce((acc, {language,contributor}) => (acc[language] = contributor, acc), {});
      reply.send(recoverObject);
    } catch (e) {
      const errorMessage = (e instanceof Error) ? e.message : e;
      reply.code(400).send({error: `${errorMessage}`});
    }
  });
  // Return assets.json object
  app.get('/assets/featured', (req, reply) => {
    try {
      const assetsJson = JSON.parse(fs.readFileSync(path.join(publicDir, 'assets/assets.json'), { encoding: 'utf8' }));
      reply.send(assetsJson);
    } catch (e) {
      const errorMessage = (e instanceof Error) ? e.message : e;
      reply.code(400).send({error: `${errorMessage}`});
    }
  });
  // Return asset object
  app.get('/assets/group/:id', (req, reply) => {
    try {
      const assetsJson = JSON.parse(fs.readFileSync(path.join(publicDir, 'assets/assets.json'), { encoding: 'utf8' }));
      const asset = assetsJson.find(a => a.id === parseInt(req.params.id));
      reply.send(asset);
    } catch (e) {
      const errorMessage = (e instanceof Error) ? e.message : e;
      reply.code(400).send({error: `${errorMessage}`});
    }
  });
  // Listen fastify on port
  app.listen(config.port || 3000, config.listen || '0.0.0.0', (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log('Mempool Cache Server is now running on', address);
  });
}

module.exports = MempoolCache;
