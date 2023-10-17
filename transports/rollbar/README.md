# Notera Rollbar Transport

This package provides a Rollbar transport for the
[Notera](https://github.com/zappen999/notera) package.

## Installation

- `npm install @notera/core @notera/rollbar`
- `yarn add @notera/core @notera/rollbar`

## Usage

```ts
import notera from '@notera/core';
import rollbarTransport from '@notera/rollbar;
import Rollbar from 'rollbar';

const rollbar = new Rollbar({ accessToken: 'YOUR_TOKEN_HERE' });
const logger = notera({
    levels: {
        err: 0,
        info: 1,
    },
});

logger.onError((err) => {
    console.log('Some unexpected happened during logging', err);
});

logger.addTransport(rollbarTransport({
    rollbar,
    // Maps our logging levels to Rollbar logging levels
    levelMap: {
        err: 'error',
        info: 'info',
    },
}));

logger.ctx('SERVER').info('Something is up', { some: 'meta' });
```

## Options

```ts
interface Opts {
    // Instance of Rollbar
    rollbar: Rollbar;

    // Maps our logging levels to Rollbar logging levels
    levelMap: Record<string, RollbarLevel>;
}
```
