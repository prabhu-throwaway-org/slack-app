const { getDatabase } = require('./mongo')
const { ObjectId } = require('mongodb')

async function insertMany (records, collectionName) {
  const options = { ordered: true }
  const database = await getDatabase()
  const { insertedCount } = await database.collection(collectionName).insertMany(records, options)
  return insertedCount
}

async function insertOne (record, collectionName) {
  const database = await getDatabase()
  record.createdAt = new Date()
  const { insertedId } = await database.collection(collectionName).insertOne(record)
  return insertedId.toString()
}

async function fetchAll (filterQuery = {}, collectionName, limit = 0) {
  const database = await getDatabase()
  return await database.collection(collectionName).find(filterQuery).sort({ $natural: 1 }).limit(limit).toArray()
}

async function countDocuments (query, collectionName) {
  const database = await getDatabase()
  const count = await database.collection(collectionName).countDocuments(query)
  return count
}

async function max (query, maxByField, collectionName) {
  const database = await getDatabase()
  const maxBy = {}
  maxBy[maxByField] = -1

  const record = await database.collection(collectionName).find(query).sort(maxBy).limit(1).toArray()
  return (record && record.length > 0) ? record[0] : null
}

async function deleteOne (id, collectionName) {
  // TODO: If no records are deleted, nothing happens. Throw an error in this scenario
  const database = await getDatabase()
  const { deletedCount } = await database.collection(collectionName).deleteOne({
    _id: new ObjectId(id)
  })
  return deletedCount
}

async function dropDatabase () {
  const database = await getDatabase()
  const databaseName = database.databaseName
  const status = await database.dropDatabase()
  return { status, databaseName }
}

/**
 *
 * If no records are returned in the filterQuery then based on the value of upsert a new record is created or nothing happens
 * @param {*} filterQuery
 * @param {*} record
 * @param {*} collectionName
 * @param {*} upsert
 */
async function updateOne (filterQuery, record = {}, collectionName, upsert = false) {
  const database = await getDatabase()
  delete record._id
  record.modifiedAt = new Date()
  const options = { upsert }
  const updateDoc = {
    $set: {
      ...record
    }
  }
  const { modifiedCount, upsertedCount } = await database.collection(collectionName).updateOne(filterQuery, updateDoc, options)
  if (upsertedCount) {
    return upsertedCount
  }

  return modifiedCount
}

async function updateMany (filterQuery, record = {}, collectionName, upsert = false) {
  const database = await getDatabase()
  delete record._id
  record.modifiedAt = new Date()
  const options = { upsert }
  const updateDoc = {
    $set: {
      ...record
    }
  }
  const { modifiedCount, upsertedCount } = await database.collection(collectionName).updateMany(filterQuery, updateDoc, options)
  if (upsertedCount) {
    return upsertedCount
  }

  return modifiedCount
}

module.exports = {
  insertMany,
  insertOne,
  fetchAll,
  countDocuments,
  deleteOne,
  updateOne,
  updateMany,
  max,
  dropDatabase
}
