const express = require('express');
const exphbs  = require('express-handlebars');
const os = require("os");
const fs = require('fs');

const { Pool } = require('pg')
const pino = require('pino');
const expressPino = require('express-pino-logger');
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const expressLogger = expressPino({ logger });

const app = express();
app.use(expressLogger);
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// Database connection
const dbconnection = process.env.DBCONNSTRING || 'postgres://user:password@localhost:5432/db';
const client = new Pool({connectionString: dbconnection});

// Configuration

var databaseresults = '';
var port = process.env.PORT || 8080;
var message = process.env.MESSAGE || 'Hello world!';
var renderPathPrefix = (
  process.env.RENDER_PATH_PREFIX ? 
    '/' + process.env.RENDER_PATH_PREFIX.replace(/^[\\/]+/, '').replace(/[\\/]+$/, '') :
    ''
);
var handlerPathPrefix = (
  process.env.HANDLER_PATH_PREFIX ? 
    '/' + process.env.HANDLER_PATH_PREFIX.replace(/^[\\/]+/, '').replace(/[\\/]+$/, '') :
    ''
);

var namespace = process.env.KUBERNETES_NAMESPACE || '-';
var podName = process.env.KUBERNETES_POD_NAME || os.hostname();
var nodeName = process.env.KUBERNETES_NODE_NAME || '-';
var nodeOS = os.type() + ' ' + os.release();
var database = dbconnection;
var applicationVersion = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
var containerImage = process.env.CONTAINER_IMAGE || 'paulbouwer/hello-kubernetes:' + applicationVersion
var containerImageArch = JSON.parse(fs.readFileSync('info.json', 'utf8')).containerImageArch;

logger.debug();
logger.debug('Configuration');
logger.debug('-----------------------------------------------------');
logger.debug('PORT=' + process.env.PORT);
logger.debug('MESSAGE=' + process.env.MESSAGE);
logger.debug('RENDER_PATH_PREFIX=' + process.env.RENDER_PATH_PREFIX);
logger.debug('HANDLER_PATH_PREFIX=' + process.env.HANDLER_PATH_PREFIX);
logger.debug('KUBERNETES_NAMESPACE=' + process.env.KUBERNETES_NAMESPACE);
logger.debug('KUBERNETES_POD_NAME=' + process.env.KUBERNETES_POD_NAME);
logger.debug('KUBERNETES_NODE_NAME=' + process.env.KUBERNETES_NODE_NAME);
logger.debug('CONTAINER_IMAGE=' + process.env.CONTAINER_IMAGE);

// Handlers

logger.debug();
logger.debug('Handlers');
logger.debug('-----------------------------------------------------');

logger.debug('Handler: static assets');
logger.debug('Serving from base path "' + handlerPathPrefix + '"');
app.use(handlerPathPrefix, express.static('static'))

logger.debug('Handler: /');
logger.debug('Serving from base path "' + handlerPathPrefix + '"');
app.get(handlerPathPrefix + '/', function (req, res) {
    res.render('home', {
      message: message,
      namespace: namespace,
      pod: podName,
      node: nodeName + ' (' + nodeOS + ')',
      database: database,
      container: containerImage + ' (' + containerImageArch + ')',
      data: databaseresults,
      renderPathPrefix: renderPathPrefix
    });
});

// Server

logger.debug();
logger.debug('Server');
logger.debug('-----------------------------------------------------');

app.listen(port, async function () {
  // query the database 
  var result = await client.query('SELECT name FROM pets');
  logger.info(result.rows);
  await result.rows.forEach( row => {
      databaseresults += row.name+' ';
  });

  logger.info("Listening on: http://%s:%s", podName, port);
});
