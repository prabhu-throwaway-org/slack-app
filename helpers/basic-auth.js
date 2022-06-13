// const userService = require('../users/user.service');

module.exports = basicAuth

async function basicAuth (req, res, next) {
  // if (req.path === '/') {
  //   return next()
  // }

  // if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
  //   return res.status(401).json({ message: 'Missing Authorization Header' })
  // }

  // const base64Credentials = req.headers.authorization.split(' ')[1]
  // const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
  // const [username, password] = credentials.split(':')

  // if (username !== process.env.ROOT_USERNAME || password !== process.env.ROOT_PASSWORD) {
  //   return res.status(401).json({ message: 'Invalid Authentication Credentials' })
  // }

  next()
}
