const { insertMany, updateOne } = require('../database/query')

async function salesforceQ () {
  const initialSalesforceQ = require('../initialSalesforceQ.json')
  for (const element of initialSalesforceQ) {
    const market = element.market
    await updateOne({ market }, element, 'salesforceQ', true)
  }
  console.log('Salesforce Q initialised')
}

async function gatekeeperQ () {
  const mockGatekeeperQ = require('../mockGatekeeperQ.json')
  const mockGatekeeperQWithDate = mockGatekeeperQ.map(x => addCreatedAt(x))
  const mockGatekeeperQInsertedCount = await insertMany(mockGatekeeperQWithDate, 'gatekeeperQ')
  console.log(`${mockGatekeeperQInsertedCount} mock record(s) inserted into GatekeeperQ`)
}

function addCreatedAt (record) {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return {
    ...record,
    createdAt: new Date(yesterday),
    expiresAt: new Date(tomorrow)
  }
}

module.exports = {
  salesforceQ,
  gatekeeperQ
}
