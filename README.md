# Sentry Appender for Log4JS

Sends logging events to [Sentry](https://www.sentry.io). This appender uses [@sentry/node](https://www.npmjs.com/package/@sentry/node). Consult the docs for sentry/node, or [sentry configuration](https://docs.sentry.io/platforms/node/configuration/options/) itself, if you want more information on the configuration options below.

## Installation

`npm install log4js-sentry`

or

`yarn add log4js-sentry`

(This is a plug-in appender for [log4js](https://log4js-node.github.io/log4js-node/), so you'll need that as well)

## Configuration

- `type` - `log4js-sentry`
- `dsn` - `string` - where to send the events ([docs](https://docs.sentry.io/platforms/node/configuration/options/#dsn))

This appender will scan the msg from the logging event, and pull out any argument of the
shape `{ tags: [] }` so that it's possible to add additional tags in a normal logging call. See the example below.

## Example

```javascript
log4js.configure({
  appenders: {
    sentry: {
      type: 'log4js-sentry',
      dsn: 'https://{KEY}@{HOST}/{PROJECT_ID}',
      tags: ['tag1'],
    },
  },
  categories: {
    default: { appenders: ['sentry'], level: 'info' },
  },
});

const logger = log4js.getLogger();
logger.info({ tags: ['my-tag-1', 'my-tag-2'] }, 'Some message');
```

This will result in a log message being sent to Sentry with the tags `tag1`, `my-tag-1`, `my-tag-2`.
