const {
  insertOne,
  fetchAll,
  countDocuments,
  updateOne,
  dropDatabase
} = require('../database/query')
const { CUSTOMER_CARE_DIALOG, LIVE_CHAT_CLOSED_DIALOG, CUSTOMER_CARE_EMAIL_DIALOG } = require('../helpers/const')
const gatekeeperQCollection = 'gatekeeperQ'
const salesforceQcollection = 'salesforceQ'
const { ObjectId } = require('mongodb')
const emailSender = require('../services/emailSender')
const liveChatOpenHoursUtil = require('../helpers/liveChatOpenHoursUtil')
const marketList = ['en', 'sv', 'da', 'no']

const controllers = {

  /**
    * The below commented gatekeeperQQuery will return records if the email has not been sent(ie., expiresAt does not exist) alone.
  */
  //  const gatekeeperQQuery = {
  //   market: req.params.market,
  //   createdAt: {
  //     $gte: new Date(from0000Hours)
  //   },
  //   expiresAt: {
  //     $exists: false
  //   }
  // }

  whichDialog: async (req, res) => {
    const salesforceQPosistionToTriggerGatekeeperLogic = parseInt(process.env.salesforceQPosistionToTriggerGatekeeperLogic)
    const gatekeeperCloseBeforeMin = parseInt(process.env.gatekeeperCloseBeforeMin)
    const liveChatOpenHourCET = liveChatOpenHoursUtil.getLiveChatOpenHour()
    const liveChatCloseHourCET = liveChatOpenHoursUtil.getLiveChatCloseHour()
    const from0000Hours = new Date()
    from0000Hours.setHours(0, 0, 0, 0)
    const currentTimeStamp = new Date()
    const localDateTimeString = currentTimeStamp.toLocaleString('sv-SE', { timeZone: 'Europe/Stockholm' })
    const currentTimeStampCET = new Date(localDateTimeString)
    const gatekeeperAppOpenTimeStamp = new Date()
    gatekeeperAppOpenTimeStamp.setHours(liveChatOpenHourCET, 0, 0, 0)
    const gatekeeperAppCloseTimeStamp = new Date()
    gatekeeperAppCloseTimeStamp.setHours(liveChatCloseHourCET - 1, gatekeeperCloseBeforeMin, 0, 0)

    /**
     * Query returns records if:
     * -  email has not yet been sent(expiresAt is false)
     *    (or)
     * -  validity has not yet expired(expiresAt greater then current timestamp)
     * -  and the record has not been validated yet(validity does not exist)
     */
    const gatekeeperQQuery = {
      market: req.params.market,
      createdAt: {
        $gte: new Date(from0000Hours)
      },
      $or: [
        {
          expiresAt: {
            $exists: false
          }
        },
        {
          $and: [
            {
              expiresAt: {
                $gte: new Date(Date.now())
              }
            },
            {
              validity: {
                $exists: false
              }
            }
          ]
        }
      ]
    }

    let salesforceQRecord
    let isMailAPIActive
    let salesforceQPosition = 0
    const salesforceQQuery = { market: req.params.market }

    let dialogToShow = CUSTOMER_CARE_DIALOG
    let yetToSendEmailOrYetToExpireCount

    try {
      yetToSendEmailOrYetToExpireCount = await countDocuments(gatekeeperQQuery, gatekeeperQCollection)
      salesforceQRecord = await fetchAll(salesforceQQuery, salesforceQcollection, 1)
      if (salesforceQRecord && salesforceQRecord.length > 0) {
        salesforceQPosition = parseInt(salesforceQRecord[0].qPosition)
        isMailAPIActive = salesforceQRecord[0].isMailAPIActive
      }
      // TODO Check if > or >=
      if (isMailAPIActive && (yetToSendEmailOrYetToExpireCount > 0 || salesforceQPosition >= salesforceQPosistionToTriggerGatekeeperLogic)) {
        // TODO Check logic after live chat close hour
        if (currentTimeStampCET < gatekeeperAppOpenTimeStamp || currentTimeStampCET > gatekeeperAppCloseTimeStamp) {
          dialogToShow = LIVE_CHAT_CLOSED_DIALOG
        } else {
          dialogToShow = CUSTOMER_CARE_EMAIL_DIALOG
        }
      }
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: err.message })
    }
    console.log('dialogToShow', { dialogToShow, salesforceQPosition, yetToSendEmailOrYetToExpireCount, textLocale: req.params.market })
    res.status(200).send(dialogToShow)
  },

  dispatchAgentAvailableEmail: async (req, res) => {
    res.status(200).send('OK')
    const body = req.body
    emailSender.dispatchAgentAvailableEmail(req.params.market, body.action)
  },

  dispatchTechnicalIssuesEmail: async (req, res) => {
    for (const market of marketList) {
      await emailSender.dispatchEmailToAllYetToSendEmailInGatekeeperQ(market, 'TechnicalIssues')
    }

    res.status(200).send('OK')
  },

  dispatchChatClosedEmail: async (req, res) => {
    for (const market of marketList) {
      await emailSender.dispatchEmailToAllYetToSendEmailInGatekeeperQ(market, 'ChatClosed')
    }

    res.status(200).send('OK')
  },

  validate: async (req, res) => {
    let isValid = false

    try {
      const filterQuery = {
        _id: new ObjectId(req.params.id)
      }
      const record = await fetchAll(filterQuery, gatekeeperQCollection, 1)
      if (record && record.length > 0) {
        const expiresAt = record[0].expiresAt
        const currentTimeStamp = new Date()
        if (!expiresAt || currentTimeStamp > expiresAt) {
          // Expired
          isValid = false
        } else {
          // Not Expired
          isValid = true
        }
        const updatedRecord = {
          validatedAt: currentTimeStamp,
          validity: isValid
        }
        updateOne(filterQuery, updatedRecord, gatekeeperQCollection)
      }
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: err.message })
    }
    res.status(200).send(isValid)
  },

  reQueue: async (req, res) => {
    let responseMsg
    try {
      const filterQuery = {
        _id: new ObjectId(req.params.id)
      }
      const record = await fetchAll(filterQuery, gatekeeperQCollection, 1)
      if (record && record.length > 0) {
        const recordToInsert = {
          email: record[0].email,
          market: record[0].market
        }
        await insertOne(recordToInsert, gatekeeperQCollection)
        responseMsg = 'reQueued'
      } else {
        responseMsg = 'invalidID'
      }
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: err.message })
    }
    res.status(200).send(responseMsg)
  },

  dropDatabase: async (req, res) => {
    const { status, databaseName } = await dropDatabase()
    if (status) {
      res.status(200).send(`Database ${databaseName} dropped`)
    } else {
      res.status(500).send(`Error when dropping database ${databaseName}`)
    }
  }
}

module.exports = controllers
