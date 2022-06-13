const localLogger = require('./localLogger')
const kubeLogger = require('./kubeLogger')
const path = require('path')

const getLabel = function (callingModule) {
  const parts = callingModule.filename.split(path.sep)
  return path.join(parts[parts.length - 2], parts.pop())
}

module.exports = function (callingModule) {
  if (process.env.NODE_ENV === 'local') {
    return localLogger(getLabel(callingModule))
  } else {
    return kubeLogger(getLabel(callingModule))
  }
}
