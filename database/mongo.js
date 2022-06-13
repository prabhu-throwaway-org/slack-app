const { MongoMemoryServer } = require('mongodb-memory-server')
const { MongoClient } = require('mongodb')

let database = null

async function startDatabase () {
  if (process.env.NODE_ENV === 'local') {
    const mongo = new MongoMemoryServer()
    await mongo.start()
    const mongoDBURL = mongo.getUri()
    const connection = await MongoClient.connect(mongoDBURL, { useNewUrlParser: true })
    database = connection.db()
    console.log('in-memory database started')
  } else {
    const mongoDBURL = `mongodb://${process.env.mongoURI}/${process.env.mongoDB}`
    const connection = await MongoClient.connect(mongoDBURL, { useNewUrlParser: true })
    database = connection.db()
    console.log('mongo database started')
  }
}

async function getDatabase () {
  if (!database) await startDatabase()
  return database
}

module.exports = {
  getDatabase,
  startDatabase
}
