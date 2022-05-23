# Notera Rollbar Transport

This package provides a Rollbar transport for the
[Notera](https://github.com/zappen999/notera) package.

[![Build Status](https://travis-ci.org/zappen999/notera-transport-rollbar.svg?branch=master)](https://travis-ci.org/zappen999/notera-transport-rollbar)
[![Coverage Status](https://coveralls.io/repos/github/zappen999/notera-transport-rollbar/badge.svg?branch=master)](https://coveralls.io/github/zappen999/notera-transport-rollbar?branch=master)

## Usage

**Example usage with Notera:**

```js
const Notera = require('notera')
const noteraTransportRollbar = require('notera-transport-rollbar')
const Rollbar = require('rollbar');

const rollbar = new Rollbar({ accessToken: 'YOUR_TOKEN_HERE' });
const logger = new Notera();

logger.on('error', err => {
  console.log('Some unexpected happened during logging', err)
})

logger.addTransport(noteraTransportRollbar({
    rollbar
  // More options
}))

// Use logger as usual
logger.ctx('SERVER').info('Something is up', { some: 'meta' })
```

## Options

```ts
interface Options {
  // Instance of Rollbar
  rollbar: Rollbar;

  // Override mappings of Notera logging levels against Rollbar levels.
  // Defaults to:
  // emerg:   'critical',
  // alert:   'critical',
  // crit:    'critical',
  // err:     'error',
  // warning: 'warning',
  // notice:  'warning',
  // info:    'info',
  // debug:   'debug'
  levelMap?: [level: string]: string;
}
```

## Installation
- `npm install notera-transport-rollbar`
- `yarn add notera-transport-rollbar`
