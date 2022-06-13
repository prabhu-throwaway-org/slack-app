const cron = require('node-cron')
const initializeCollections = require('../helpers/initializeCollections')
const emailSender = require('../services/emailSender')
const marketList = ['en', 'sv', 'da', 'no']
const schedulerOptions = {
  scheduled: true,
  timezone: 'Europe/Stockholm'
}

function start () {
  // TODO: Pull this value from livechat open hours API
  const weekdayliveChatOpenHour = process.env.weekday_liveChatOpenHour
  const weekdayLiveChatCloseHour = process.env.weekday_liveChatCloseHour
  const saturdayliveChatOpenHour = process.env.saturday_liveChatOpenHour
  const saturdayLiveChatCloseHour = process.env.saturday_liveChatCloseHour
  const sundayLiveChatOpenHour = process.env.sunday_liveChatOpenHour
  const sundayLiveChatCloseHour = process.env.sunday_liveChatCloseHour

  const minuteForLiveChatClosedCron = 60 - parseInt(process.env.emailExpireInMinutes)
  const timerTriggerIntervalMin = process.env.timerTriggerIntervalMin

  const weekdayTimerTriggerCron = `*/${timerTriggerIntervalMin} ${weekdayliveChatOpenHour}-${weekdayLiveChatCloseHour} * * 1-5`
  console.log(`Cron Started : TimerTrigger(Weekday) : ${weekdayTimerTriggerCron}`)
  cron.schedule(weekdayTimerTriggerCron, async () => {
    try {
      console.log('Cron Run : TimerTrigger(Weekday) : Dispatching e-mail')
      for (const market of marketList) {
        await emailSender.dispatchAgentAvailableEmail(market, 'TimerTrigger')
      }
    } catch (err) {
      console.error(`${err}`)
    }
  }, schedulerOptions)

  const saturdayTimerTriggerCron = `*/${timerTriggerIntervalMin} ${saturdayliveChatOpenHour}-${saturdayLiveChatCloseHour} * * 6`
  console.log(`Cron Started : TimerTrigger(Saturday) : ${saturdayTimerTriggerCron}`)
  // TODO: Pull this value from livechat open hours API
  cron.schedule(saturdayTimerTriggerCron, async () => {
    try {
      console.log('Cron Run : TimerTrigger(Saturday) : Dispatching e-mail')
      for (const market of marketList) {
        await emailSender.dispatchAgentAvailableEmail(market, 'TimerTrigger')
      }
    } catch (err) {
      console.error(`${err}`)
    }
  }, schedulerOptions)

  const sundayTimerTriggerCron = `*/${timerTriggerIntervalMin} ${sundayLiveChatOpenHour}-${sundayLiveChatCloseHour} * * 0`
  console.log(`Cron Started : TimerTrigger(Sunday) : ${sundayTimerTriggerCron}`)
  // TODO: Pull this value from livechat open hours API
  cron.schedule(sundayTimerTriggerCron, async () => {
    try {
      console.log('Cron Run : TimerTrigger(Sunday) : Dispatching e-mail')
      for (const market of marketList) {
        await emailSender.dispatchAgentAvailableEmail(market, 'TimerTrigger')
      }
    } catch (err) {
      console.error(`${err}`)
    }
  }, schedulerOptions)

  // The SalesforceQ Collection is reset to initial values at 00:00 everyday
  console.log('Cron Started : Reset Salesforce Q : 0 0 * * *')
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('Cron Run : Reset Salesforce Q')
      initializeCollections.salesforceQ()
    } catch (err) {
      console.error(`${err}`)
    }
  }, schedulerOptions)

  const weekdayHourForLiveChatClosedCron = parseInt(weekdayLiveChatCloseHour) - 1
  const weekdayLiveChatClosedCron = `${minuteForLiveChatClosedCron} ${weekdayHourForLiveChatClosedCron} * * 1-5`
  console.log(`Cron Started : Live Chat Closed(Weekday) : ${weekdayLiveChatClosedCron}`)
  cron.schedule(weekdayLiveChatClosedCron, async () => {
    try {
      console.log('Cron Run : Live Chat Closed(Weekday) : Dispatching e-mail')
      for (const market of marketList) {
        await emailSender.dispatchAgentAvailableEmail(market, 'ChatClosedAgentAvailable')
        await emailSender.dispatchEmailToAllYetToSendEmailInGatekeeperQ(market, 'ChatClosed')
      }
    } catch (err) {
      console.error(`${err}`)
    }
  }, schedulerOptions)

  const saturdayHourForLiveChatClosedCron = parseInt(saturdayLiveChatCloseHour) - 1
  const saturdayLiveChatClosedCron = `${minuteForLiveChatClosedCron} ${saturdayHourForLiveChatClosedCron} * * 6`
  console.log(`Cron Started : Live Chat Closed(Saturday) : ${saturdayLiveChatClosedCron}`)
  cron.schedule(saturdayLiveChatClosedCron, async () => {
    try {
      console.log('Cron Run : Live Chat Closed(Saturday) : Dispatching eMail')
      for (const market of marketList) {
        await emailSender.dispatchAgentAvailableEmail(market, 'ChatClosedAgentAvailable')
        await emailSender.dispatchEmailToAllYetToSendEmailInGatekeeperQ(market, 'ChatClosed')
      }
    } catch (err) {
      console.error(`${err}`)
    }
  }, schedulerOptions)

  const sundayHourForLiveChatClosedCron = parseInt(sundayLiveChatCloseHour) - 1
  const sundayLiveChatClosedCron = `${minuteForLiveChatClosedCron} ${sundayHourForLiveChatClosedCron} * * 0`
  console.log(`Cron Started : Live Chat Closed(Sunday) : ${sundayLiveChatClosedCron}`)
  cron.schedule(sundayLiveChatClosedCron, async () => {
    try {
      console.log('Cron Run : Live Chat Closed(Sunday) : Dispatching eMail')
      for (const market of marketList) {
        await emailSender.dispatchAgentAvailableEmail(market, 'ChatClosedAgentAvailable')
        await emailSender.dispatchEmailToAllYetToSendEmailInGatekeeperQ(market, 'ChatClosed')
      }
    } catch (err) {
      console.error(`${err}`)
    }
  }, schedulerOptions)
}

module.exports = {
  start
}
