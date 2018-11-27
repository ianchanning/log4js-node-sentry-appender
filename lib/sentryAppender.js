const log4js = require('log4js')
const Sentry = require('@sentry/node')

const levels = log4js.levels

var lowerLevelToSentry

function setSentryScope(scope, config) {
    config = config || {}

    // tags
    let tags = config.tags || {}
    for (let tagKey in tags) {
        scope.setTag(tagKey, tags[tagKey])
    }

    // extras
    let extras = config.extras || {}
    for (let extraKey in extras) {
        scope.setExtra(extraKey, extras[extraKey])
    }

    // user
    let user = config.user
    if (user) scope.setUser(user)

    // level —— don't, or the level would always be this level unless re config the scope, no matter what level put in the Sentry.captureXxxx
    // let level = config.level
    // if (level) scope.setLevel(level)
}

function sentryAppender(layout) {
    return (loggingEvent) => {
        let {level, levelStr} = loggingEvent.level
        levelStr = levelStr.toLowerCase()  // uppercase will be ignored, level fallbacks to default (info)

        const lowerLevelNrToSentry = (levels[lowerLevelToSentry.toUpperCase()] || {}).level || levels.INFO.level

        if (lowerLevelNrToSentry <= level) {
            let [error_or_message, additionalData] = loggingEvent.data

            if (additionalData instanceof Object && additionalData.constructor === Object) {
                additionalData = Object.assign(additionalData, {level: level})
            } else {
                additionalData = {}
            }

            Sentry.withScope(scope => {
                setSentryScope(scope, additionalData)

                if (error_or_message instanceof Error) {
                    Sentry.captureException(error_or_message, levelStr)
                } else if (error_or_message) {
                    Sentry.captureMessage(error_or_message, levelStr)
                }
            })
        }

    }
}

function configure(config, layouts) {
    let layout = layouts.colouredLayout

    if (!config.dns) {
        throw new Error('Sentry appender requires dns property in config.')
    }

    Sentry.init({dsn: config.dns, environment: config.env})

    if (config.layout) {
        layout = layouts.layout(config.layout.type, config.layout)
    }

    lowerLevelToSentry = config.level

    let globalScopes = config.globalScopes
    Sentry.configureScope(scope => {
        setSentryScope(scope, globalScopes)
    })

    return sentryAppender(layout)
}

exports.appender = sentryAppender
exports.configure = configure
