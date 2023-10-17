# Notera
> Logging interface with support for transports

This package provides a common interface to enable logging to various
destinations using transports. Since logging is so different in
different applications and contexts, we want to have a generic logging
interface, and let you control the destination format using transports.

If you expect a "batteries included" solution for your logging needs,
this might not be for you.

## Table of contents
1. [Installation](#installation)
2. [Usage](#usage)
    1. [Logging interface](#logging-interface)
    2. [Options](#options)
    3. [Building a transport](#building-a-transport)
    4. [Configuring a transport](#building-a-transport)
    5. [Events](#events)
3. [Transport implementations](#transport-implementations)

## Installation
- `npm install @notera/core`
- `yarn add @notera/core`


## Usage

**Example usages:**

```ts
import notera from '@notera/core';

const options = {
    levels: {
        emerg: 0,
        alert: 1,
        crit: 2,
        err: 3,
        warning: 4,
        notice: 5,
        info: 6,
        debug: 7,
    },
};
const logger = notera(options);

logger.log('info', 'Hello');
// > Transports receives: { level: 'info', msg: 'Hello' }

logger.emerg('Hello', new Error());
// > Transports receives: { level: 'emerg', msg: 'Hello', meta: [<Error>] }

logger.alert('Hello', true, false);
// > Transports receives: { level: 'alert', msg: 'Hello', meta: [true, false] }

logger.crit('Hello', { some: 'data' }, true, new Error());
// > Transports receives:
// {
//   level: 'crit',
//   msg: 'Hello',
//   meta: [
//     { some: 'data' },
//     true,
//     <Error>,
//   ],
// }

logger.warning('Hello');
logger.notice('Hello');
logger.info('Hello');
logger.debug('Hello');
```

### Options

```ts
interface Options {
    // Global context for this logger
    ctx?: string;

    // Logging levels to use
    levels: { [key: string]: number };
}
```

### Building a transport

A transport is simply a function that handles logging entries from a
predictable format. A transport can either be synchronous or
asynchronous. The difference is that you return a promise when you want
to handle each log entry asynchronously. When doing this, Notera will
catch rejected promises and emit an `error` event. Read more about
events [here](#events).

#### Synchronous transport example

```ts
function consoleTransport({ ctx, level, msg, meta }): void {
    console.log(`${Date.now()} ${level}: ${msg}`, err, meta)
}

logger.addTransport({ callback: consoleTransport });
```

#### Asynchronous transport example

```ts
// ...
import fs from 'fs/promises';

async function fileTransport({ ctx, level, msg, meta }): Promise<void> {
    const line = `${Date.now()} ${level}: ${msg}\n`
    await fs.appendFile('application.log', line)
}

logger.addTransport({ callback: fileTransport });

// We should listen to errors if the transport fails
logger.onError((err, entry, transport) => {
    // Log to console if the file transport fails
    console.log(`Error in transport '${transport.name}': ${err.message}`)
    console.log(entry) // Contains the failed log entry
});
```

### Configure a transport

Transports can be configured to act in different ways.

```ts
interface Transport {
    callback: (entry: LogEntry<LevelsT, MetaT>) => Promise<void> | void;

    // Name of the transport, to be able to reference it later on
    name?: string;

    // Levels that this transport should handle, or all levels if not specified
    levels?: LevelsT[];
}
```

### Events

Notera will emit events in certain situations. It's up to you to listen
and act on them. See the [asynchronous transport
example](#asynchronous-transport-example) to see how to listen to
events.

- **onError()**: Errors are emitted when an async transport fails
  (rejected promise).

## Transport implementations
- **[Terminal Transport](../transports/terminal/)**
  \- A customizable terminal transport for development purposes
- **[Rollbar Transport](../transports/rollbar/)**
  \- Transport for logging to Rollbar
