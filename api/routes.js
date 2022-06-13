'use strict'

const gatekeeperQControllers = require('../controllers/gatekeeperQControllers')
const salesforceQControllers = require('../controllers/salesforceQControllers')
const customerCareControllers = require('../controllers/customerCareControllers')

module.exports = (gatekeeperApp) => {
  gatekeeperApp.route('/gatekeeperQCount/:market')
    .get(gatekeeperQControllers.countDocuments)
  gatekeeperApp.route('/gatekeeperQ')
    .get(gatekeeperQControllers.fetchAll)
    .post(gatekeeperQControllers.insertOne)
  gatekeeperApp.route('/gatekeeperQ/:id')
    .put(gatekeeperQControllers.updateOne)
    .delete(gatekeeperQControllers.deleteOne)

  gatekeeperApp.route('/salesforceQ')
    .get(salesforceQControllers.fetchAll)
  gatekeeperApp.route('/salesforceQ/:market')
    .put(salesforceQControllers.updateOne)
  gatekeeperApp.route('/decrementSalesforceQ/:market')
    .post(salesforceQControllers.decrementOne)

  gatekeeperApp.route('/whichDialog/:market')
    .get(customerCareControllers.whichDialog)
  gatekeeperApp.route('/dispatchAgentAvailableEmail/:market')
    .post(customerCareControllers.dispatchAgentAvailableEmail)
  gatekeeperApp.route('/validate/:id')
    .get(customerCareControllers.validate)
  gatekeeperApp.route('/reQueue/:id')
    .post(customerCareControllers.reQueue)

  // TODO: Administrative use with caution
  gatekeeperApp.route('/dropdatabase')
    .post(customerCareControllers.dropDatabase)
  gatekeeperApp.route('/dispatchTechnicalIssuesEmail')
    .post(customerCareControllers.dispatchTechnicalIssuesEmail)
  gatekeeperApp.route('/dispatchChatClosedEmail')
    .post(customerCareControllers.dispatchChatClosedEmail)
  gatekeeperApp.route('/closeAll')
    .put(salesforceQControllers.closeAll)
  gatekeeperApp.route('/openAll')
    .put(salesforceQControllers.openAll)
}
