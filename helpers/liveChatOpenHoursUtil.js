const axios = require('axios').create({
  timeout: 1000
})

const checkLiveChatHours = (lang) => {
  return new Promise((resolve, reject) => {
    openHoursAPI(resolve, reject, lang)
  })
}

const openHoursAPI = (resolve, reject, lang) => {
  const path = `/isLiveChatOpen?locale=${lang}`

  axios.get(process.env.livechatOpenHoursApi + path).then(response => {
    if (response.data) {
      resolve(response.data.open)
    }
    resolve(false)
  }).catch(err => {
    console.error(err)
    resolve(false)
  })
}

const getLiveChatOpenHour = () => {
  // Sunday - Saturday : 0 - 6
  const dayOfWeek = new Date().getDay()
  switch (dayOfWeek) {
    case 0:
      return parseInt(process.env.sunday_liveChatOpenHour)
    case 6:
      return parseInt(process.env.saturday_liveChatOpenHour)
    default:
      return parseInt(process.env.weekday_liveChatOpenHour)
  }
}

const getLiveChatCloseHour = () => {
  // Sunday - Saturday : 0 - 6
  const dayOfWeek = new Date().getDay()
  switch (dayOfWeek) {
    case 0:
      return parseInt(process.env.sunday_liveChatCloseHour)
    case 6:
      return parseInt(process.env.saturday_liveChatCloseHour)
    default:
      return parseInt(process.env.weekday_liveChatCloseHour)
  }
}

module.exports = {
  checkLiveChatHours,
  getLiveChatOpenHour,
  getLiveChatCloseHour
}
