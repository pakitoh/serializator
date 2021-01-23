# Serializator

Serializator is a TCP server for node.js that serialize numbers in a log file.


## Requirements

### Functional 
1. The application must accept input from at most 5 concurrent clients on TCP/IP port
4000.
2. Input lines presented to the application via its socket must either be composed of
exactly nine decimal digits (e.g. 314159265 or 007007009) immediately followed by a
server-native newline sequence, or a termination sequence as detailed below.
3. Numbers presented to the application must include leading zeros as necessary to
ensure they are 9 decimal digits long.
4. The log file, to be named ​ numbers.log​
, must be created and/or cleared when the
Application starts.
5. Only numbers may be written to the log file. Each number must be followed by a
server-native newline sequence.
6. No duplicate numbers may be written to the log file.
7. Any data that does not conform to a valid line of input should be discarded
and the client connection terminated immediately and without comment.
8. Every 10 seconds, the application must print a report to standard output:
a. The difference since the last report of the count of new unique numbers that
have been received.
b. The difference since the last report of the count of new duplicate numbers
that have been received.
c. The total number of unique numbers received for this execution of the
application.
d. Example output: ​ Received 50 unique numbers, 2 duplicates.
Unique total: 567231.
9. If any connected client writes a single line with only the word "terminate" followed by
a server-native newline sequence, the application must disconnect all clients and
perform a clean shutdown as quickly as possible.
10. Clearly state all of the assumptions you made in completing the application.

## Non functional
- The application must not use external systems such as Redis, Kafka, Postgres, etc.
- The application must use only the standard library, but you may use common test
libraries and libraries that improve readability, such as Java guava, Go testify, etc.
- A robust throughput is 2 million operations every 10 secs in commodity hardware
(e.g. 2017 Macbook Pro).


## Usage

To run the server
```
npm start
```

To connect using netcat
```
nc localhost 4000
```
