const {
  createLogger,
  format,
  addColors,
  transports
} = require('winston')
const {
  combine,
  timestamp,
  label,
  printf,
  errors,
  colorize
} = format

const logLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    chat: 4,
    debug: 5
  },
  colors: {
    error: 'red',
    warn: 'magenta',
    info: 'green',
    chat: 'grey',
    debug: 'yellow'
  }
}

const myFormat = printf(({ level, message, label, timestamp, stack, ...meta }) => {
  let logMessage = `${level}: ${stack || message} `
  if (Object.keys(meta).length !== 0) {
    logMessage += (JSON.stringify(meta, null, 2))
  }
  logMessage += ` ${timestamp} ${label}`
  return logMessage
})
addColors(logLevels.colors)
function localLogger (callingFile) {
  return createLogger({
    levels: logLevels.levels,
    format: combine(
      colorize({ message: true, level: true }),
      label({ label: callingFile }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      myFormat,
      errors({ stack: true })
    ),
    transports: [
      new transports.Console({ level: 'debug' })
    ]
  })
}

module.exports = localLogger
