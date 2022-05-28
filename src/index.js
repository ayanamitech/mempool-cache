const fastify = require('fastify');
const fastifyCors = require('@fastify/cors');
const fastifyStatic = require('@fastify/static');

const process = require('process');
const path = require('path');

const Worker = require('./worker');
const config = require('./config');
const router = require('./router');

const MempoolCache = () => {
  Worker(config);
  const app = fastify();
  const publicDir = path.join(process.cwd(), 'public');
  // Define CORS for requests from browser
  app.register(fastifyCors, router.cors);
  // Serve static data files
  app.register(fastifyStatic, {
    root: publicDir
  });
  // Serve static data files for /api/v1
  app.register(fastifyStatic, {
    root: publicDir,
    prefix: '/api/v1/',
    decorateReply: false // Fix "The decorator 'sendFile' has already been added!" error
  });
  // Return donations.json object
  app.get('/donations', router.donations);
  // Return contributors.json object
  app.get('/contributors', router.contributors);
  // Recover and return translators.json object
  app.get('/translators', router.translators);
  // Return assets.json object
  app.get('/assets/featured', router.assets_featured);
  // Return asset object
  app.get('/assets/group/:id', router.assets_group);
  // Return donations.json object
  app.get('/api/v1/donations', router.donations);
  // Return contributors.json object
  app.get('/api/v1/contributors', router.contributors);
  // Recover and return translators.json object
  app.get('/api/v1/translators', router.translators);
  // Return assets.json object
  app.get('/api/v1/assets/featured', router.assets_featured);
  // Return asset object
  app.get('/api/v1/assets/group/:id', router.assets_group);
  // Listen fastify on port
  app.listen(config.port || 3000, config.listen || '0.0.0.0', (err, address) => {
    if (err) {
      console.error('Error from fastify frontend');
      console.error(err);
      process.exit(1);
    }
    console.log('Mempool Cache Server is now running on', address);
  });
};

module.exports = MempoolCache;
