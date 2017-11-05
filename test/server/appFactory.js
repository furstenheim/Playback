module.exports = {create: createApp}
const express = require('express')
const browserify = require('browserify-middleware')
const port = 3000
const http = require('http')
const model = require('./model')
const path = require('path')
function createApp () {
  const app = express()
  app.use('/api/json', function (req, res, next) {
    return res.json(model.json())
  })
  app.use(express.static(__dirname))
  app.get('/bundle/main.js', function (req, res, next) {
    console.log('getting bundle', req.originalUrl)
    next()
  })
  app.get('/bundle/main.js', browserify(path.join(__dirname, 'main.js')))
  const server = http.createServer(app)
  server.listen(port)
  return server
}
