jest.mock('net', () => ({
  createServer: jest.fn(),
}));
const mockServer = jest.fn();
mockServer.listen = jest.fn();
mockServer.close = jest.fn();
mockServer.unref = jest.fn();
jest.mock('fs');
jest.mock('timers');
const { appendFile, writeFile } = require('fs');
const { createServer } = require('net');
const { setInterval } = require('timers');
const server = require('../src/server');

createServer.mockReturnValue(mockServer);

const filename = 'numbers.log';

describe('TCP server', () => {
  it('should create server when start', () => {
    server.start();

    expect(createServer).toHaveBeenCalled();
  });

  it('should listen connections in port 4000 when start', () => {
    server.start();

    expect(mockServer.listen).toHaveBeenCalledWith(4000);
  });

  it('should accept 5 concurrent connections top when start', () => {
    server.start();

    expect(mockServer.maxConnections).toBe(5);
  });

  it('should create or clear log file when start', () => {
    server.start();

    expect(writeFile).toHaveBeenCalledWith(filename, '', expect.any(Function));
  });

  it('should run report every 10 secs', () => {
    server.start();

    expect(setInterval).toHaveBeenCalledWith(server.getReport, 10000);
  });

  describe('Connection listener', () => {
    it('should encode data from connection in utf8', () => {
      const connection = {
        setEncoding: jest.fn(),
        on: jest.fn(),
      };

      server.connectionListener(connection);

      expect(connection.setEncoding).toHaveBeenCalledWith('utf8');
    });

    it('should process received data', () => {
      const connection = {
        setEncoding: jest.fn(),
        on: jest.fn(),
      };

      server.connectionListener(connection);

      expect(connection.on).toHaveBeenCalledWith('data', expect.any(Function));
    });
  });

  describe('Data handler', () => {
    beforeEach(() => {
      server.start(); // to clear state
    });

    it('should write in log file data when is 9 digits plus newline', () => {
      const data = '123456789\n';

      server.dataHandler(data);

      expect(appendFile).toHaveBeenCalledWith(filename, data, server.erroHandler);
    });

    it('should NOT write in log file already received valid inputs', () => {
      const data = '123456789\n';
      server.dataHandler(data);

      server.dataHandler(data);

      expect(appendFile).toHaveBeenCalledTimes(1);
    });

    it('should shutdown server when received "terminate" as input', () => {
      const data = 'terminate\n';
      const connection = {};

      server.dataHandler(data, connection, server);

      expect(appendFile).not.toHaveBeenCalled();
      expect(mockServer.close).toHaveBeenCalled();
    });

    it('should discard data otherwise and close connection', () => {
      const data = 'different_data\n';
      const connection = {
        destroy: jest.fn(),
      };

      server.dataHandler(data, connection);

      expect(appendFile).not.toHaveBeenCalled();
      expect(connection.destroy).toHaveBeenCalled();
    });
  });

  describe('Report', () => {
    global.console = { log: jest.fn() };

    beforeEach(() => {
      server.start();
    });

    it('should get empty report when no inpust have been received', () => {
      server.getReport();

      // eslint-disable-next-line no-console
      expect(console.log).toHaveBeenCalledWith('Received 0 unique numbers, 0 duplicates. Unique total: 0.');
    });

    it('should increment received unique numbers counter when unique number received', () => {
      const data1 = '111111111\n';
      server.dataHandler(data1);

      server.getReport();

      // eslint-disable-next-line no-console
      expect(console.log).toHaveBeenCalledWith('Received 1 unique numbers, 0 duplicates. Unique total: 1.');
    });

    it('should increment duplicate numbers counter when duplicate number received', () => {
      const data1 = '111111111\n';
      server.dataHandler(data1);
      server.dataHandler(data1);

      server.getReport();

      // eslint-disable-next-line no-console
      expect(console.log).toHaveBeenCalledWith('Received 1 unique numbers, 1 duplicates. Unique total: 1.');
    });

    it('should increment duplicate numbers counter when duplicate number received', () => {
      const data1 = '111111111\n';
      server.dataHandler(data1);
      const data2 = '222222222\n';
      server.dataHandler(data2);

      server.getReport();

      // eslint-disable-next-line no-console
      expect(console.log).toHaveBeenCalledWith('Received 2 unique numbers, 0 duplicates. Unique total: 2.');
    });

    it('should clear unique and duplicates counters after creating report', () => {
      const data1 = '111111111\n';
      server.dataHandler(data1);
      server.getReport();

      server.getReport();

      // eslint-disable-next-line no-console
      expect(console.log).toHaveBeenCalledWith('Received 0 unique numbers, 0 duplicates. Unique total: 1.');
    });
  });
});
