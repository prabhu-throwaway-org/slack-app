function errorHandler (err, req, res, next) {
  if (typeof (err) === 'string') {
    console.error(err)
    return res.status(400).json({ message: err })
  } else if (err.status === 404) {
    console.error(err.message)
    return res.status(404).json({ message: err.message })
  }
  console.error(err.message)
  return res.status(500).json({ message: err.message })
}

module.exports = errorHandler
