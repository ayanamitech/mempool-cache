const fastify = require('fastify');
const fastifyCors = require('fastify-cors');
const fastifyStatic = require('fastify-static');
const qs = require('qs');

const process = require('process');
const path = require('path');
const fs = require('fs');

const worker = require('./worker');
const { setSafeInterval, getFailedLogs } = require('./lib');

/**
const MempoolCache = () => {

}
**/
