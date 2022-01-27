'use strict';

const log4js = require('log4js');
const Sentry = require('@sentry/node');
const { Scope } = require('@sentry/hub');

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
 * @param layout (unused) a function that takes a logevent and returns a string (defaults to objectLayout).
 */
function sentryAppender(config /*, layout */) {
  if (!config.dsn) {
    throw new Error('Sentry appender requires dsn property in config.');
  }

  const client = new Sentry.NodeClient({
    dsn: config.dsn,
    environment: config.env,
  });
  return (loggingEvent) => {
    const levels = log4js.levels;
    const { level: loggingLevel, levelStr } = loggingEvent.level;
    let configLevel;
    try {
      configLevel = levels[config.level.toUpperCase()].level;
    } catch (e) {
      // bury it - don't know why???
    }
    if (configLevel && configLevel <= loggingLevel) {
      let [event, eventMeta = {}] = loggingEvent.data;

      let scope = new Scope();
      let { user, tags, fringerprint, level, extra } = eventMeta;
      if (user || tags || fringerprint || level || extra) {
        if (user) scope.setUser(user);
        if (tags) Object.keys(tags).map((k) => scope.setTag(k, tags[k]));
        if (fringerprint) scope.setFingerprint(fringerprint);
        if (level) scope.setLevel(level);
        if (extra) Object.keys(extra).map((k) => scope.setExtra(k, extra[k]));
      }

      if (event instanceof Error) {
        client.captureException(event.message, event, scope); // level=error, hint should be event/Error or ...
      } else if (event instanceof Object) {
        client.captureEvent(event, {}, scope); // level inside event
      } else if (typeof event === 'string') {
        client.captureMessage(
          event,
          level || levelStr.toLowerCase(),
          {},
          scope
        );
      }
    }
  };
}

function configure(config, layouts) {
  let layout = layouts.colouredLayout;
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }
  return sentryAppender(config, layout);
}

exports.appender = sentryAppender;
exports.configure = configure;
