const { appendFile, writeFile } = require('fs');
const { createServer } = require('net');
const { setInterval } = require('timers');
const { EOL } = require('os');

const kill = require('./killer');

const PORT = 4000;
const MAX_CONNECTIONS = 5;
const ENCODING = 'utf8';
const DATA_EVENT = 'data';
const ERROR_EVENT = 'error';
const VALID_COMPLETE_NUMBER_REGEX = /^\d{9}$/;
const VALID_INCOMPLETE_NUMBER_REGEX = /^\d{1,8}$/;
const LOG_FILENAME = 'numbers.log';
const REPORT_INTERVAL = 10000;
const END_KEYWORD = 'terminate';

let tcpServer;
let clients;
let validInputs;
let report;
let dataNotWritten;

function erroHandler(err) {
  if (err) {
    // eslint-disable-next-line no-console
    console.log(`MY_ERROR:  ${err}`);
    throw err;
  }
}

function closeServer() {
  clients.forEach((client) => {
    client.destroy();
  });
  tcpServer.close(erroHandler);
  kill();
}

function clearReport() {
  report = {
    unique: 0,
    duplicates: 0,
  };
}

function getReport(err) {
  if (err) {
    erroHandler(err);
  }
  // eslint-disable-next-line no-console
  console.log(`Received ${report.unique} unique numbers, ${report.duplicates} duplicates. Unique total: ${validInputs.size}.`);
  clearReport();
}

function writeToFile(writeBatch) {
  if (writeBatch.length > 0) {
    appendFile(LOG_FILENAME, writeBatch.join(''), erroHandler);
  }
}

function dataHandler(receivedData, connection) {
  const inputData = dataNotWritten + receivedData;
  dataNotWritten = '';
  const tokens = inputData.split(EOL);
  const last = tokens.length - 1;
  let keepProcessing = true;
  const writeBatch = [];
  for (let i = 0; i < tokens.length && keepProcessing; i += 1) {
    if (tokens[i] === END_KEYWORD) {
      keepProcessing = false;
      closeServer();
    } else if (VALID_COMPLETE_NUMBER_REGEX.test(tokens[i])) {
      if (validInputs.has(tokens[i])) {
        report.duplicates += 1;
      } else {
        validInputs.add(tokens[i]);
        writeBatch.push(`${tokens[i]}${EOL}`);
        report.unique += 1;
      }
    } else if (VALID_INCOMPLETE_NUMBER_REGEX.test(tokens[i]) && i === last) {
      dataNotWritten = tokens[i];
    } else if (tokens[i] === '' && i === last) {
      // do nothing
    } else {
      keepProcessing = false;
      connection.destroy();
      connection.unref();
      clients.delete(connection);
    }
  }
  writeToFile(writeBatch);
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
  tcpServer.on(ERROR_EVENT, erroHandler);
  tcpServer.listen(PORT, erroHandler);
  tcpServer.maxConnections = MAX_CONNECTIONS;
  clients = new Set();
  validInputs = new Set();
  dataNotWritten = '';
  clearReport();
  writeFile(LOG_FILENAME, '', erroHandler);
  setInterval(getReport, REPORT_INTERVAL);
}

module.exports = {
  start,
  connectionListener,
  getDataNotWritten: () => dataNotWritten,
  dataHandler,
  erroHandler,
  getReport,
  closeServer,
};
