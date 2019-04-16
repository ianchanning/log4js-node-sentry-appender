const log4js = require('log4js');
const levels = log4js.levels;
const Sentry = require('@sentry/node');
const { Scope } = require('@sentry/hub');

function sentryAppender(client, config, layout) {
    return (loggingEvent) => {
        const { level: loggingLevel, levelStr } = loggingEvent.level;
        let configLevel;
        try { configLevel = levels[config.level.toUpperCase()].level; } catch (e) {}
        if (configLevel && configLevel <= loggingLevel) {
            let [event, eventMeta={}] = loggingEvent.data;

            let scope = new Scope();
            let { user, tags, fringerprint, level, extra } = eventMeta;
            if (user || tags || fringerprint || level || extra) {
                if (user) scope.setUser(user);
                if (tags) Object.keys(tags).map(k => scope.setTag(k, tags[k]));
                if (fringerprint) scope.setFingerprint(fringerprint);
                if (level) scope.setLevel(level);
                if (extra) Object.keys(extra).map(k => scope.setExtra(k, extra[k]));
            }

            if (event instanceof Error) {
                client.captureException(event.message, event, scope);  // level=error, hint should be event/Error or ...
            } else if (event instanceof Object) {
                client.captureEvent(event, {}, scope);  // level inside event
            } else if (typeof event === 'string') {
                client.captureMessage(event, level || levelStr.toLowerCase(), {}, scope);
            }
        }
    };
}

function configure(config, layouts) {
    let layout = layouts.colouredLayout;

    if (!config.dns) {
        throw new Error('Sentry appender requires dns property in config.');
    }

    const client = new Sentry.NodeClient({dsn: config.dns, environment: config.env});

    if (config.layout) {
        layout = layouts.layout(config.layout.type, config.layout);
    }

    return sentryAppender(client, config, layout);
}

exports.appender = sentryAppender;
exports.configure = configure;