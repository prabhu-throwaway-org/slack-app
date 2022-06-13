const {
  fetchAll,
  updateOne,
  updateMany
} = require('../database/query')
const collectionName = 'salesforceQ'

const controllers = {

  fetchAll: async (req, res) => {
    const filterQuery = {}
    if (req.params && req.params.market) {
      filterQuery.market = req.params.market
    }
    res.send(await fetchAll(filterQuery, collectionName, 0))
  },

  decrementOne: async (req, res) => {
    const filterQuery = {
      market: req.params.market
    }
    let modifiedCount
    try {
      const salesforceQRecord = await fetchAll(filterQuery, collectionName, 1)
      if (salesforceQRecord && salesforceQRecord.length > 0 && parseInt(salesforceQRecord[0].qPosition) > 0) {
        const updatedRecord = {
          qPosition: parseInt(salesforceQRecord[0].qPosition) - 1
        }
        modifiedCount = await updateOne(filterQuery, updatedRecord, collectionName, false)
      }
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: err.message })
    }
    res.status(200).send(`${modifiedCount} record(s) updated`)
  },

  updateOne: async (req, res) => {
    const updatedRecord = req.body
    const filterQuery = {
      market: req.params.market
    }
    let modifiedCount
    try {
      modifiedCount = await updateOne(filterQuery, updatedRecord, collectionName, true)
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: err.message })
    }
    res.status(200).send(`${modifiedCount} record(s) updated`)
  },

  openAll: async (req, res) => {
    const updatedRecord = {
      isMailAPIActive: true
    }
    let modifiedCount
    try {
      modifiedCount = await updateMany({}, updatedRecord, collectionName)
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: err.message })
    }
    res.status(200).send(`${modifiedCount} record(s) updated`)
  },

  closeAll: async (req, res) => {
    const updatedRecord = {
      isMailAPIActive: false
    }
    let modifiedCount
    try {
      modifiedCount = await updateMany({}, updatedRecord, collectionName)
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: err.message })
    }
    res.status(200).send(`${modifiedCount} record(s) updated`)
  }
}

module.exports = controllers
