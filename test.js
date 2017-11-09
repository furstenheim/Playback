const puppeteer = require('puppeteer')
const CDP = require('chrome-remote-interface')
const appFactory = require('./test/server/appFactory')
const url = require('url')
module.exports = {main}
const serverModel = require('./test/server/model')
async function main () {
  const app = appFactory.create()
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto('http://localhost:3000')
  const endPoint = browser.wsEndpoint()
  const options = url.parse(endPoint)
  const client = await new Promise(function (resolve, reject) {
    CDP({host: options.hostname, port: options.port}, function (client) {
      resolve(client)
    })
  })
  const {Network} = client
  await Network.enable()
  await Network.setRequestInterceptionEnabled({enabled: true})
  let requestResult
  await Network.requestIntercepted(function (requestObject) {
    const {interceptionId, request} = requestObject
    requestResult = requestObject
    console.log(request)
    Network.continueInterceptedRequest({interceptionId})
  })

  let requestWillBeSent
  await Network.requestWillBeSent(function (requestWillBeSentObject) {
    requestWillBeSent = requestWillBeSentObject
  })
  let response
  await Network.responseReceived(function (responseObject) {
    response = responseObject
  })
  console.log('Network intecepted')
  const json = await page.evaluate(async function () {
    const result = await r2.post('http://localhost:3000/api/json', {json: {obj: true}}).json
    return result
  })
  console.log(json)
  return {browser, app, page, client, requestResult, response, requestWillBeSent}
}

