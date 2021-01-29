# Serializator

## Description

Serializator is a TCP server for node.js that serialize numbers in a log file.


## Requirements

### Functional

    1. The application must accept input from at most 5 concurrent clients on TCP/IP port 4000.
    2. Input lines presented to the application via its socket must either be composed of exactly nine decimal digits (e.g. 314159265 or 007007009) immediately followed by a server-native newline sequence, or a termination sequence as detailed below.
    3. Numbers presented to the application must include leading zeros as necessary to ensure they are 9 decimal digits long.
    4. The log file, to be named ​ numbers.log​, must be created and/or cleared when the Application starts.
    5. Only numbers may be written to the log file. Each number must be followed by a server-native newline sequence.
    6. No duplicate numbers may be written to the log file.
    7. Any data that does not conform to a valid line of input should be discarded and the client connection terminated immediately and without comment.
    8. Every 10 seconds, the application must print a report to standard output:
      a. The difference since the last report of the count of new unique numbers that have been received.
      b. The difference since the last report of the count of new duplicate numbers that have been received.
      c. The total number of unique numbers received for this execution of the application.
      d. Example output: ​ Received 50 unique numbers, 2 duplicates. Unique total: 567231.
    9. If any connected client writes a single line with only the word "terminate" followed by a server-native newline sequence, the application must disconnect all clients and perform a clean shutdown as quickly as possible.
    10. Clearly state all of the assumptions you made in completing the application.

## Non functional
    - The application must not use external systems such as Redis, Kafka, Postgres, etc.
    - The application must use only the standard library, but you may use common test libraries and libraries that improve readability, such as Java guava, Go testify, etc.
    - A robust throughput is 2 million operations every 10 secs in commodity hardware (e.g. 2017 Macbook Pro).


## Development

It looks like a I/O bounded problem so [Nodejs](https://nodejs.org/) seems like a good platform to solve it.

[Npm](https://www.npmjs.com/) as package manager.

[Jest](https://jestjs.io/) to unit test (it's my first time using this lib)

[ESLint](https://eslint.org/) as linter



## Usage

### Run tests

To build the image
```
npm test
```

### Start the server

#### 1. Using [Docker](https://www.docker.com/)


First you have to build the image
```
docker build -t tcp-server .
```

And then you can run the server
```
 docker run --name my-server -p 4000:4000 -a stdout -a stderr -v tcp-server-volume:/usr/src/app tcp-server
```

Whenever you want to pull out numbers.log file from docker volume
```
docker cp my-server:/usr/src/app/numbers.log .
```

#### 2. Using [Npm](https://www.npmjs.com/)

To run the server
```
npm start
```

### Connect a client

#### 1. Using [GNU Netcat](http://netcat.sourceforge.net/)

```
nc localhost 4000
```
You can now type whatever you want to send to the server and hit `Enter` key

#### 2. Using client script to send 10M requests
```
node src/client.js
```

