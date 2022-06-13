const en = require('../en.json')
const sv = require('../sv.json')
const no = require('../no.json')
const da = require('../da.json')

const getText = (key, args = {}, lang = 'en') => {
  if (args && args.lang) {
    lang = args.lang
  }

  const str = getValue(key, lang)

  return format(str, args)
}

const getValue = (key, lang) => {
  let val = en[key]

  if (lang) {
    if (lang === 'sv' && sv.hasOwnProperty(key)) {
      val = sv[key]
    } else if (lang === 'da' && da.hasOwnProperty(key)) {
      val = da[key]
    } else if (lang === 'no' && no.hasOwnProperty(key)) {
      val = no[key]
    }
  }
  return val
}

const format = (str, data) => {
  if (typeof str === 'string' && (data instanceof Array)) {
    return str.replace(/({\d})/g, function (i) {
      return data[i.replace(/{/, '').replace(/}/, '')]
    })
  } else if (typeof str === 'string' && (data instanceof Object)) {
    if (Object.keys(data).length === 0) {
      return str
    }

    // eslint-disable-next-line no-unreachable-loop
    for (const key in data) {
      return str.replace(/({([^}]+)})/g, function (i) {
        const key = i.replace(/{/, '').replace(/}/, '')

        if (!data[key]) {
          return i
        }

        return data[key]
      })
    }
  // eslint-disable-next-line no-mixed-operators
  } else if (typeof str === 'string' && data instanceof Array === false || typeof str === 'string' && data instanceof Object === false) {
    return str
  }
  return str
}

module.exports = getText
