## Sentry log4js appender

This package requires @sentry/node

An example of the config: multiple sentry server supported

```javascript
const log4js = require('log4js');

log4js.configure({
  appenders: {
    console: { type: 'console' },
    server1: {  
      type: 'log4js-node-sentry-appender', 
      dns: 'https://{KEYS}@{HOST}/{PROJECT_ID}', 
      env: 'production' 
    },
    server2: {  
      type: 'log4js-node-sentry-appender', 
      dns: 'https://{KEYS}@{HOST}/{PROJECT_ID}', 
      env: 'production' 
    }
  },
  categories: {
    default: { 
      appenders: ['console', 'server1'], 
      level: 'error' 
    },
    debug: { 
      appenders: ['console', 'server2'], 
      level: 'debug' 
    }
  }
});

var logger_default = log4js.getLogger();
var logger_debug = log4js.getLogger('debug');
```
