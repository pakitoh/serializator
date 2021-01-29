jest.mock('net', () => ({
  createServer: jest.fn(),
}));
jest.mock('fs');
jest.mock('timers');
jest.mock('../src/killer');
const { appendFile, writeFile } = require('fs');
const { createServer } = require('net');
const { setInterval } = require('timers');
const kill = require('../src/killer');
const server = require('../src/server');

const mockServer = jest.fn();
mockServer.listen = jest.fn();
mockServer.close = jest.fn();
mockServer.unref = jest.fn();
mockServer.on = jest.fn();
createServer.mockReturnValue(mockServer);
const connection = {
  setEncoding: jest.fn(),
  on: jest.fn(),
  destroy: jest.fn(),
};
kill.mockImplementation(() => {});

const filename = 'numbers.log';

beforeEach(() => {
  server.start();
});

afterEach(() => {
  server.closeServer();
  expect(kill).toHaveBeenCalled();
});

describe('TCP server', () => {
  it('should create server when start', () => {
    expect(createServer).toHaveBeenCalled();
  });

  it('should listen connections in port 4000 when start', () => {
    expect(mockServer.listen).toHaveBeenCalledWith(4000, server.erroHandler);
  });

  it('should handle errors whit error handler', () => {
    server.start();

    expect(mockServer.on).toHaveBeenCalledWith('error', server.erroHandler);
  });

  it('should accept 5 concurrent connections top when start', () => {
    server.start();

    expect(mockServer.maxConnections).toBe(5);
  });

  it('should create or clear log file when start', () => {
    server.start();

    expect(writeFile).toHaveBeenCalledWith(filename, '', server.erroHandler);
  });

  it('should run report every 10 secs', () => {
    server.start();

    expect(setInterval).toHaveBeenCalledWith(server.getReport, 10000);
  });

  describe('Connection listener', () => {
    it('should encode data from connection in utf8', () => {
      server.connectionListener(connection);

      expect(connection.setEncoding).toHaveBeenCalledWith('utf8');
    });

    it('should process received data', () => {
      server.connectionListener(connection);

      expect(connection.on).toHaveBeenCalledWith('data', expect.any(Function));
    });
  });

  describe('Data handler', () => {
    it('should write in log file data when is 9 digits plus newline', () => {
      const data = '123456789\n';

      server.dataHandler(data, connection);

      expect(appendFile).toHaveBeenCalledWith(filename, data, server.erroHandler);
    });

    it('should write in log file data when is 9 digits plus newline plus less than 9 digits', () => {
      const data1 = '123456789\n';
      const data2 = '111';
      const data = `${data1}${data2}`;

      server.dataHandler(data, connection);

      expect(appendFile).toHaveBeenCalledWith(filename, data1, server.erroHandler);
      expect(server.getDataNotWritten()).toBe(data2);
    });

    it('should complete received data with data not written when both joined are a valid input', () => {
      const data1 = '123456789\n';
      const data2 = '111';
      const data = `${data1}${data2}`;
      server.dataHandler(data, connection);
      const data3 = '111111\n';

      server.dataHandler(data3, connection);

      expect(appendFile).toHaveBeenCalledWith(filename, data1, server.erroHandler);
      expect(appendFile).toHaveBeenCalledWith(filename, data2 + data3, server.erroHandler);
      expect(server.getDataNotWritten()).toBe('');
    });

    it('should NOT write in log file already received valid inputs', () => {
      const data = '123456789\n';
      server.dataHandler(data, connection);

      server.dataHandler(data, connection);

      expect(appendFile).toHaveBeenCalledTimes(1);
    });

    it('should shutdown server when received "terminate" as input', () => {
      const data = 'terminate\n';

      server.dataHandler(data, connection);

      expect(appendFile).not.toHaveBeenCalled();
      expect(mockServer.close).toHaveBeenCalled();
    });

    it('should discard non numeric data otherwise and close connection', () => {
      const data = 'different\n';

      server.dataHandler(data, connection);

      expect(appendFile).not.toHaveBeenCalled();
      expect(connection.destroy).toHaveBeenCalled();
    });

    it('should discard numeric data with no required length and close connection', () => {
      const data = '123\n';

      server.dataHandler(data, connection);

      expect(appendFile).not.toHaveBeenCalled();
      expect(connection.destroy).toHaveBeenCalled();
    });

    it('should discard non numeric data when it is not ended by newline and close connection 2', () => {
      const data = 'diff';

      server.dataHandler(data, connection);

      expect(appendFile).not.toHaveBeenCalled();
      expect(connection.destroy).toHaveBeenCalled();
    });
  });

  describe('Report', () => {
    global.console = { log: jest.fn() };

    it('should get empty report when no inpust have been received', () => {
      server.getReport();

      // eslint-disable-next-line no-console
      expect(console.log).toHaveBeenCalledWith('Received 0 unique numbers, 0 duplicates. Unique total: 0.');
    });

    it('should increment received unique numbers counter when unique number received', () => {
      const data1 = '111111111\n';
      server.dataHandler(data1, connection);

      server.getReport();

      // eslint-disable-next-line no-console
      expect(console.log).toHaveBeenCalledWith('Received 1 unique numbers, 0 duplicates. Unique total: 1.');
    });

    it('should increment received unique numbers counter when another unique number received in the same call as well', () => {
      const data = '111111111\n222222222\n';
      server.dataHandler(data, connection);

      server.getReport();

      // eslint-disable-next-line no-console
      expect(console.log).toHaveBeenCalledWith('Received 2 unique numbers, 0 duplicates. Unique total: 2.');
    });

    it('should increment duplicate numbers counter when duplicate number received', () => {
      const data1 = '111111111\n';
      server.dataHandler(data1, connection);
      server.dataHandler(data1, connection);

      server.getReport();

      // eslint-disable-next-line no-console
      expect(console.log).toHaveBeenCalledWith('Received 1 unique numbers, 1 duplicates. Unique total: 1.');
    });

    it('should increment duplicate numbers counter when duplicate number received', () => {
      const data1 = '111111111\n';
      server.dataHandler(data1, connection);
      const data2 = '111111111\n';
      server.dataHandler(data2, connection);

      server.getReport();

      // eslint-disable-next-line no-console
      expect(console.log).toHaveBeenCalledWith('Received 1 unique numbers, 1 duplicates. Unique total: 1.');
    });

    it('should clear unique and duplicates counters after creating report', () => {
      const data1 = '111111111\n';
      server.dataHandler(data1, connection);
      server.getReport();

      server.getReport();

      // eslint-disable-next-line no-console
      expect(console.log).toHaveBeenCalledWith('Received 0 unique numbers, 0 duplicates. Unique total: 1.');
    });
  });
});
