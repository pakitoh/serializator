const { appendFile, writeFile } = require('fs');
const { createServer } = require('net');
const { setInterval } = require('timers');

const PORT = 4000;
const MAX_CONNECTIONS = 5;
const ENCODING = 'utf8';
const DATA_EVENT = 'data';
const VALID_INPUT_REGEX = /^\d{9}$/m;
const LOG_FILENAME = 'numbers.log';
const REPORT_INTERVAL = 10000;
const END_KEYWORD = 'terminate';

let tcpServer;
let clients;
let validInputs;
let report;

function closeServer() {
  clients.forEach((client) => {
    client.destroy();
  });
  tcpServer.close(() => {
    process.exit(0);
  });
}

function clearReport() {
  report = {
    unique: 0,
    duplicates: 0,
  };
}

function getReport() {
  // eslint-disable-next-line no-console
  console.log(`Received ${report.unique} unique numbers, ${report.duplicates} duplicates. Unique total: ${validInputs.size}.`);
  clearReport();
}

function erroHandler(err) {
  if (err) throw err;
}

function dataHandler(data, connection) {
  if (data.trim() === END_KEYWORD) {
    closeServer();
  } else if (VALID_INPUT_REGEX.test(data)) {
    if (validInputs.has(data)) {
      report.duplicates += 1;
    } else {
      validInputs.add(data);
      appendFile(LOG_FILENAME, data, erroHandler);
      report.unique += 1;
    }
  } else {
    connection.destroy();
    clients.delete(connection);
  }
}

function connectionListener(connection) {
  connection.setEncoding(ENCODING);
  connection.on(DATA_EVENT, (data) => {
    dataHandler(data, connection);
  });
  clients.add(connection);
}

function start() {
  tcpServer = createServer(connectionListener);
  tcpServer.listen(PORT);
  tcpServer.maxConnections = MAX_CONNECTIONS;
  clients = new Set();
  validInputs = new Set();
  clearReport();
  writeFile(LOG_FILENAME, '', erroHandler);
  setInterval(getReport, REPORT_INTERVAL);
}

module.exports = {
  start,
  connectionListener,
  dataHandler,
  erroHandler,
  getReport,
  closeServer,
};
