const path = require('path')
const ENV_FILE = path.join(__dirname, '.env')
require('dotenv').config({ path: ENV_FILE })
const logger = require('./logger')(module)

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const helmet = require('helmet')
// const morgan = require('morgan') Uncomment to see morgan logs
const timeout = require('connect-timeout')
const basicAuth = require('./helpers/basic-auth')
const errorHandler = require('./helpers/error-handler')
const scheduler = require('./helpers/schedulers')
const initializeCollections = require('./helpers/initializeCollections')
const gitHubController = require('./helpers/gitHubController')

const routes = require('./api/routes')
const { startDatabase } = require('./database/mongo')

const gatekeeperApp = express()

gatekeeperApp.use(helmet())
gatekeeperApp.use(bodyParser.json())
gatekeeperApp.use(cors())
// gatekeeperApp.use(morgan('combined')) Uncomment to see morgan logs
gatekeeperApp.use('/public', express.static(path.join(__dirname, '/public')))
gatekeeperApp.use(basicAuth)
gatekeeperApp.use(timeout('10s'))
routes(gatekeeperApp)

// INFO: The below middlewares should always be in this order and should be the last middlewares
gatekeeperApp.use((req, res, next) => {
  const error = new Error('Not Found')
  error.status = 404
  next(error)
})
gatekeeperApp.use(errorHandler)
gatekeeperApp.use(haltOnTimedout)

function haltOnTimedout (req, res, next) {
  if (!req.timedout) next()
}

const port = process.env.PORT || 3003

startDatabase().then(async () => {
  gatekeeperApp.listen(port, async () => {
    gitHubController.cloneRepo()
    console.log(`listening on port ${port}`)
  })
})

console.log = function () {
  logger.info.apply(logger, arguments)
}

console.error = function () {
  logger.error.apply(logger, arguments)
}
