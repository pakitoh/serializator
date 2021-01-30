const { createConnection } = require('net');
const { EOL } = require('os');

const BASE_NUMBER = 111111111;
const MAX = 121111111;

const socket = createConnection({ port: 4000 }, () => {
  // eslint-disable-next-line no-console
  console.log(`Connected to Serializator Server!\nStarting to send ${MAX - BASE_NUMBER} requests...\n`);

  for (let number = BASE_NUMBER; number < MAX; number += 1) {
    socket.write(`${number}${EOL}`, 'utf8', (err) => {
      if (err) {
        throw err;
      }
    });
  }

  // eslint-disable-next-line no-console
  console.log('... and that\'s it!');

  process.exit(0);
});
