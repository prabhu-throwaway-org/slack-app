const {
  insertOne,
  fetchAll,
  countDocuments,
  deleteOne,
  updateOne
} = require('../database/query')
const { ObjectId } = require('mongodb')
const collectionName = 'gatekeeperQ'

const controllers = {
  fetchAll: async (req, res) => {
    let record
    try {
      record = await fetchAll({}, collectionName, 0)
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: err.message })
    }
    res.send(record)
  },

  insertOne: async (req, res) => {
    const newRecord = req.body
    let id
    try {
      id = await insertOne(newRecord, collectionName)
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: err.message })
    }
    res.status(200).send({ id })
  },

  countDocuments: async (req, res) => {
    const query = { market: req.params.market }
    let size
    try {
      size = await countDocuments(query, collectionName)
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: err.message })
    }
    res.status(200).send(size.toString())
  },

  deleteOne: async (req, res) => {
    let deletedCount = 0
    try {
      deletedCount = await deleteOne(req.params.id, collectionName)
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: err.message })
    }
    res.send({ message: `${deletedCount} record(s) deleted` })
  },

  updateOne: async (req, res) => {
    const updatedRecord = req.body
    let modifiedCount = 0
    try {
      const filterQuery = {
        _id: new ObjectId(req.params.id)
      }
      modifiedCount = await updateOne(filterQuery, updatedRecord, collectionName)
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: err.message })
    }
    res.status(200).send(`${modifiedCount} record(s) updated`)
  }
}

module.exports = controllers
