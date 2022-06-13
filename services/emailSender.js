const {
  fetchAll,
  max,
  updateMany
} = require('../database/query')
const gatekeeperQCollection = 'gatekeeperQ'
const salesforceQcollection = 'salesforceQ'
const axios = require('axios').default
const fs = require('fs').promises
const i18n = require('../resources/i18n')
const path = require('path')

async function dispatchAgentAvailableEmail (market, dispatchEmailSource) {
  const numberOfEmailsToSendForAPITrigger = parseInt(process.env.numberOfEmailsToSendForAPITrigger)
  const numberOfEmailsToSendForTimerTrigger = parseInt(process.env.numberOfEmailsToSendForTimerTrigger)
  // 1 minute added as buffer time
  const emailExpireInMinutes = parseInt(process.env.emailExpireInMinutes) + 1
  const salesforceQPosistionToTriggerGatekeeperLogic = parseInt(process.env.salesforceQPosistionToTriggerGatekeeperLogic)
  const salesforceQQuery = { market }
  const maxByField = 'qPosition'
  let numberOfEmailsToSend
  let currentSalesforceQ = 0

  const currentSalesforceQRecord = await max(salesforceQQuery, maxByField, salesforceQcollection)
  if (currentSalesforceQRecord) {
    currentSalesforceQ = parseInt(currentSalesforceQRecord.qPosition)
  }

  if (dispatchEmailSource === 'TimerTrigger') {
    if (currentSalesforceQ < salesforceQPosistionToTriggerGatekeeperLogic) {
      numberOfEmailsToSend = numberOfEmailsToSendForTimerTrigger + (salesforceQPosistionToTriggerGatekeeperLogic - (currentSalesforceQ + 1))
    } else {
      numberOfEmailsToSend = numberOfEmailsToSendForTimerTrigger
    }
  } else if (dispatchEmailSource === 'ChatClosedAgentAvailable') {
    numberOfEmailsToSend = process.env.ChatClosedAgentAvailableEmailsToSend
  } else {
    if (currentSalesforceQ < salesforceQPosistionToTriggerGatekeeperLogic) {
      // TODO : Write documentation for the below formula
      numberOfEmailsToSend = numberOfEmailsToSendForAPITrigger + (salesforceQPosistionToTriggerGatekeeperLogic - (currentSalesforceQ + 1))
    }
  }

  if (numberOfEmailsToSend) {
    const from0000Hours = new Date().setHours(0, 0, 0, 0)
    const currentTimeStamp = new Date()
    const expiresAt = new Date(currentTimeStamp.getTime() + emailExpireInMinutes * 60000)

    const filterQueryForFetch = {
      market,
      createdAt: {
        $gte: new Date(from0000Hours)
      },
      expiresAt: {
        $exists: false
      }
    }

    const record = {
      expiresAt,
      dispatchEmailSource,
      emailSentAt: currentTimeStamp
    }
    let recordsToUpdateArray
    const recordIdsToUpdate = []
    try {
      recordsToUpdateArray = await fetchAll(filterQueryForFetch, gatekeeperQCollection, parseInt(numberOfEmailsToSend))
      if (recordsToUpdateArray && recordsToUpdateArray.length > 0) {
        for (const element of recordsToUpdateArray) {
          recordIdsToUpdate.push(element._id)
          await send(element.email, market, `${getContactUsURL(market)}/?turi_token=${element._id}`, 'AgentAvailable')
        }
        const filterQueryForUpdate = {
          _id: {
            $in: recordIdsToUpdate
          }
        }
        await updateMany(filterQueryForUpdate, record, gatekeeperQCollection, false)
        console.log({
          message: 'e-mail Sent',
          numberOfEmails: recordIdsToUpdate.length,
          dispatchEmailSource,
          textLocale: market
        })
      } else {
        console.log({
          message: 'e-mail Not Sent',
          reason: 'No Records in Gatekeeper Queue',
          dispatchEmailSource,
          textLocale: market
        })
      }
    } catch (err) {
      console.error(err)
    }
  } else {
    console.log({
      message: 'e-mail Not Sent',
      reason: 'Current SFQueue > Gatekeeper Threshold',
      dispatchEmailSource,
      textLocale: market
    })
  }
}

async function dispatchEmailToAllYetToSendEmailInGatekeeperQ (market, dispatchEmailSource) {
  const from0000Hours = new Date().setHours(0, 0, 0, 0)
  const currentTimeStamp = new Date()

  const filterQueryForFetch = {
    market,
    createdAt: {
      $gte: new Date(from0000Hours)
    },
    expiresAt: {
      $exists: false
    }
  }
  const expiresAt = new Date()

  const record = {
    expiresAt,
    dispatchEmailSource,
    emailSentAt: currentTimeStamp
  }

  let recordsToUpdateArray
  const recordIdsToUpdate = []
  try {
    recordsToUpdateArray = await fetchAll(filterQueryForFetch, gatekeeperQCollection, 0)
    if (recordsToUpdateArray && recordsToUpdateArray.length > 0) {
      for (const element of recordsToUpdateArray) {
        recordIdsToUpdate.push(element._id)
        await send(element.email, market, getContactUsURL(market), dispatchEmailSource)
      }
      const filterQueryForUpdate = {
        _id: {
          $in: recordIdsToUpdate
        }
      }
      await updateMany(filterQueryForUpdate, record, gatekeeperQCollection, false)
      console.log({
        message: 'e-mail Sent',
        numberOfEmails: recordIdsToUpdate.length,
        dispatchEmailSource,
        textLocale: market
      })
    } else {
      console.log({
        message: 'e-mail Not Sent',
        reason: 'No Records in Gatekeeper Queue',
        dispatchEmailSource,
        textLocale: market
      })
    }
  } catch (err) {
    console.error(err)
  }
}

function getContactUsURL (market) {
  let turiUrl
  switch (market) {
    case 'sv':
      turiUrl = process.env.contactUS_URL_sv
      break
    case 'no':
      turiUrl = process.env.contactUS_URL_no
      break
    case 'da':
      turiUrl = process.env.contactUS_URL_dk
      break
    default:
      turiUrl = process.env.contactUS_URL_en
  }
  return turiUrl
}

async function closeGatekeeperApp () {
  const updatedRecord = {
    isMailAPIActive: false
  }
  try {
    await updateMany({}, updatedRecord, 'salesforceQ')
    console.log('Gatekeeper App Closed')
  } catch (err) {
    console.error('Error in closeGatekeeperApp' + err)
  }
}

async function send (receipentEmailId, market, contactUrl, template) {
  const options = {
    headers: {
      'Content-Type': 'application/json'
    }
  }

  const url = process.env.mailSenderApi
  let emailContent
  let subject

  switch (template) {
    case 'AgentAvailable':
      ({ subject, emailContent } = await agentAvailabeEmail(market, contactUrl))
      break
    case 'ChatClosed':
    case 'TechnicalIssues':
      ({ subject, emailContent } = await closedOrTechnicalIssuesEmail(market, contactUrl, template))
      break
  }
  try {
    const data = {
      delivery: {
        sender: 'SAS TURI <turi@sas.se>',
        recipient: [
          receipentEmailId
        ]
      },
      message: {
        messageBody: Buffer.from(emailContent).toString('base64'),
        subject: subject

      }
    }
    if (process.env.NODE_ENV === 'local') {
      console.log(`${template} email send to ${receipentEmailId} Click : ${contactUrl}`)
    } else {
      await axios.post(url, data, options)
    }
  } catch (error) {
    closeGatekeeperApp()
    throw Error(error)
  }
}

async function agentAvailabeEmail (market, contactUrl) {
  const subject = i18n('agent_available_subject', { lang: market })
  const doNotReplyMessage = i18n('do_not_reply_message', { lang: market })
  const greeting = i18n('greeting', { lang: market })
  const mailReceiveReason = i18n('mail_receive_reason', { lang: market })
  const mainMessage = i18n('agent_available_main_message', { lang: market })
  const linkActiveMessage = i18n('link_active_message', { lang: market })
  const notIntendedMessage = i18n('not_intended_message', { lang: market })
  const buttonText = i18n('button_text', { lang: market })
  const templatePath = path.join(__dirname, '/AgentAvailable.html')

  let emailContent = await fs.readFile(templatePath, 'binary')

  emailContent = emailContent.replace('#DO_NOT_REPLY_MESSAGE#', doNotReplyMessage)
  emailContent = emailContent.replace('#GREETING#', greeting)
  emailContent = emailContent.replace('#SUBJECT#', subject)
  emailContent = emailContent.replace('#BUTTON_TEXT#', buttonText)
  emailContent = emailContent.replace('#CONTACTUS_URL#', contactUrl)
  emailContent = emailContent.replace('#MAIL_RECEIVE_REASON#', mailReceiveReason)
  emailContent = emailContent.replace('#MAIN_MESSAGE#', mainMessage)
  emailContent = emailContent.replace('#LINK_ACTIVE_MESSAGE#', linkActiveMessage)
  emailContent = emailContent.replace('#NOT_INTENDED_MESSAGE#', notIntendedMessage)
  return { subject, emailContent }
}

async function closedOrTechnicalIssuesEmail (market, contactUrl, template) {
  let subject
  let mainMessage
  const doNotReplyMessage = i18n('do_not_reply_message', { lang: market })
  const greeting = i18n('greeting', { lang: market })
  const mailReceiveReason = i18n('mail_receive_reason', { lang: market })
  const contactUsOpeningHoursMessage = i18n('contact_us_openingHours_message', { lang: market, contact_url: contactUrl })
  const notIntendedMessage = i18n('not_intended_message', { lang: market })

  switch (template) {
    case 'ChatClosed':
      subject = i18n('chat_closed_subject', { lang: market })
      mainMessage = i18n('chat_closed_main_message', { lang: market })
      break
    case 'TechnicalIssues':
      subject = i18n('technical_issues_subject', { lang: market })
      mainMessage = i18n('technical_issues_main_message', { lang: market })
      break
  }
  const templatePath = path.join(__dirname, '/Closed_TechnicalIssues.html')

  let emailContent = await fs.readFile(templatePath, 'binary')

  emailContent = emailContent.replace('#DO_NOT_REPLY_MESSAGE#', doNotReplyMessage)
  emailContent = emailContent.replace('#SUBJECT#', subject)
  emailContent = emailContent.replace('#GREETING#', greeting)
  emailContent = emailContent.replace('#MAIL_RECEIVE_REASON#', mailReceiveReason)
  emailContent = emailContent.replace('#MAIN_MESSAGE#', mainMessage)
  emailContent = emailContent.replace('#CONTACT_US_OPENING_HOURS_MESSAGE#', contactUsOpeningHoursMessage)
  emailContent = emailContent.replace('#NOT_INTENDED_MESSAGE#', notIntendedMessage)
  return { subject, emailContent }
}

module.exports = {
  dispatchAgentAvailableEmail,
  dispatchEmailToAllYetToSendEmailInGatekeeperQ
}
