# Notera
> Logging interface with support for transports

This package provides a common interface to enable logging to various
destinations using transports. Since logging is so different in different
applications and contexts, we want to have a generic logging interface, and let
you control the destination format using transports.

If you expect a "batteries included" solution for your logging needs, this might
not be for you.

[![Build Status](https://travis-ci.org/zappen999/notera.svg?branch=master)](https://travis-ci.org/zappen999/notera)
[![Coverage
Status](https://coveralls.io/repos/github/zappen999/notera/badge.svg?branch=master)](https://coveralls.io/github/zappen999/notera?branch=master)

## Table of contents
1. [Usage](#usage)
    1. [Logging interface](#logging-interface)
    2. [Options](#options)
    3. [Building a transport](#building-a-transport)
    3. [Configuring a transport](#building-a-transport)
2. [Events](#events)
3. [Transport implementations](#transport-implementations)


## Usage

### Logging interface

Since there are many logging scenarios, and each scenario requires different
data to be logged, Notera's log functions can handle input arguments in any
order. The transports however, expects data to arrive in a specific format to
be able to handle each entry. Because of this, Notera will classify the input
arguments.

The classification will:

- Take the first found **string** argument, and use it as the **message (msg)**
- Take the first found **Error instance** argument, and use it as the **error
  (err)**
- Take any other data, whether it's a string, Error, or object, and place it
  inside the **meta** key. If there is more than one argument falling into this
  category, it will become an array with the values.

**Example usages:**

```js
const options = { ... }
const logger = new Notera(options)

logger.log('info', 'Hello')
// > Transports receives: { level: 'info', msg: 'Hello' }

logger.emerg(new Error(), 'Hello')
// > Transports receives: { level: 'emerg', msg: 'Hello', err: <Error> }

logger.alert('Hello', true, false)
// > Transports receives: { level: 'alert', msg: 'Hello', meta: [true, false] }

logger.crit({ some: 'data' }, true, new Error(), 'Hello')
// > Transports receives:
// {
//   level: 'crit',
//   msg: 'Hello',
//   meta: [
//     { some: 'data' },
//     true
//   ],
//   err: <Error>
// }

logger.err('Hello', 'world')
// > Transports receives: { level: 'err', msg: 'Hello', meta: 'world' }

logger.warning('Hello')
logger.notice('Hello')
logger.info('Hello')
logger.debug('Hello')
```

### Options

```ts
interface Options {
  // Global context for this logger
  ctx?: string;
  // Logging levels to use, defaults to Linux kernel levels*:
  levels?: { [key: string]: number };
}
```

\* *Linux kernel levels:*

```js
{
  emerg: 0,
  alert: 1,
  crit: 2,
  err: 3,
  warning: 4,
  notice: 5,
  info: 6,
  debug: 7
}
```

### Building a transport

A transport is simply a function that handles logging entries from a predictable
format. A transport can either be synchronous or asynchronous. The difference
is that you return a promise when you want to handle each log entry
asynchronously. When doing this, Notera will catch rejected promises and emit an
`error` event. Read more about events [here](#events).

#### Synchronous transport example

```js
const logger = new Notera()

function consoleTransport ({ ctx, level, msg, err, meta }) {
  console.log(`${Date.now()} ${level}: ${msg}`, err, meta)
}

logger.addTransport(consoleTransport)
```

#### Asynchronous transport example

```js
const fs = require('fs')
const { promisify } = require('util')
const appendFile = promisify(fs.appendFile)

const logger = new Notera()

function fileTransport ({ ctx, level, msg, err, meta }) {
  const line = `${Date.now()} ${level}: ${msg}\n`
  return appendFile('application.log', line)
}

logger.addTransport(fileTransport)

// We should listen to errors if the transport fails
logger.on('error', ({ err, entry, transport }) => {
  // Log to console if the file transport fails
  console.log(`Error in transport '${transport.name}': ${err.message}`)
  console.log(entry) // Contains the failed log entry
})
```

### Configure a transport

Transports can be configured to act in different ways.

```ts
interface TransportOptions {
  // Name of the transport, to be able to reference it later on
  name?: string;
  // Levels that this transport should handle, or all levels if not specified
  levels?: string[];
}
```

### Events

Notera will emit events in certain situations. It's up to you to listen and act
on them. See the
[asynchronous transport example](#asynchronous-transport-example) to see how to
listen to events.

- **error**: Emitted when an async transport has failed (rejected promise).

## Transport implementations
*TBD: Link to compatible transports*

## Installation
- `npm install notera`
- `yarn add notera`
