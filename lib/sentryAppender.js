const log4js = require('log4js');
const Sentry = require('@sentry/node');

const levels = log4js.levels;

var lowerLevelToSentry

function sentryAppender(layout) {
  return (loggingEvent) => {
    const { level } = loggingEvent.level;

    const lowerLevelNrToSentry = (levels[lowerLevelToSentry.toUpperCase()] || {}).level || levels.INFO.level

    if (lowerLevelNrToSentry <= level) {
      const [errorMessage, error] = loggingEvent.data;
      if (error) {
        Sentry.captureException(error);
      } else if (errorMessage) {
        Sentry.captureMessage(errorMessage, level)
      }
    }

  };
}

function configure(config, layouts) {
  let layout = layouts.colouredLayout;

  if (!config.dns) {
    throw new Error('Sentry appender requires dns property in config.');
  }

  Sentry.init({ dsn: config.dns, environment: config.env });

  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }

  lowerLevelToSentry = config.level

  return sentryAppender(layout);
}

exports.appender = sentryAppender;
exports.configure = configure;
