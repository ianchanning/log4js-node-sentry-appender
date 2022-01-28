'use strict';

const Sentry = require('@sentry/node');

/**
 * Sentry Appender. Sends logging events to Sentry using sentry/node, optionally adding tags.
 *
 * This appender will scan the msg from the logging event, and pull out any argument of the
 * shape `{ tags: [] }` so that it's possible to add tags in a normal logging call.
 *
 * For example:
 *
 * logger.info({ tags: ['my-tag-1', 'my-tag-2'] }, 'Some message', someObj, ...)
 *
 * And then this appender will remove the tags param and append it to the config.tags.
 *
 * @param config object with sentry configuration data
 */
function sentryAppender(config, layout) {
  const client = new Sentry.NodeClient({ ...config });
  const app = (loggingEvent) => {
    const { levelStr } = loggingEvent.level;
    const [event, eventMeta = {}] = loggingEvent.data;

    const scope = new Sentry.Scope();
    const { user, tags, fingerprint, level, extra } = eventMeta;
    if (user) {
      scope.setUser(user);
    }
    if (tags) {
      Object.keys(tags).forEach((key) => scope.setTag(key, tags[key]));
    }
    if (fingerprint) {
      scope.setFingerprint(fingerprint);
    }
    if (level) {
      // @see Sentry.Severity
      // expect that Sentry level is used (see parseLevel)
      scope.setLevel(level);
    }
    if (extra) {
      Object.keys(extra).forEach((key) => scope.setExtra(key, extra[key]));
    }

    // handle mismatch of warn -> warning for Sentry
    const parseLevel = (log4jsLevel) => {
      if (log4jsLevel === 'WARN') {
        return Sentry.Severity.Warning;
      }
      return log4jsLevel.toLowerCase();
    };

    if (event instanceof Error) {
      // (event, hint, scope)
      // @link https://docs.sentry.io/platforms/node/configuration/filtering/#event-hints
      // level=error, hint should be event/Error or ...
      client.captureException(event, event, scope);
    } else if (event instanceof Object) {
      // level inside event
      client.captureEvent(event, {}, scope);
    } else if (typeof event === 'string') {
      client.captureMessage(
        layout(loggingEvent),
        level || parseLevel(levelStr),
        {},
        scope
      );
    }
  };

  // @link https://log4js-node.github.io/log4js-node/writing-appenders.html#example-shutdown
  // app.shutdown = () => {}

  return app;
}

function configure(config = {}, layouts) {
  let layout = layouts.messagePassThroughLayout;
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }
  if (!config.dsn) {
    throw new Error('Sentry appender requires dsn property in config.');
  }

  return sentryAppender(config, layout);
}

module.exports.configure = configure;
