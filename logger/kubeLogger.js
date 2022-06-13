const {
  createLogger,
  format,
  transports
} = require('winston')
const {
  combine,
  timestamp,
  json
} = format
const pjson = require('../package.json')
const logLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    chat: 4,
    debug: 5
  }
}

function kubeLogger (callingFile) {
  // TODO: Check what the transports is doing here
  return createLogger({
    levels: logLevels.levels,
    format: combine(
      timestamp(),
      format.errors({ stack: true }),
      json()
    ),
    defaultMeta: { application: pjson.name, filename: callingFile },
    transports: [
      new transports.Console({ level: 'chat' })
    ]
  })
}

module.exports = kubeLogger
