const puppeteer = require('puppeteer')
const appFactory = require('./server/appFactory')
const serverModel = require('./server/model')
const sinon = require('sinon')
const assert = require('assert')
const r2 = require('r2')
const CDP = require('chrome-remote-interface')
const url = require('url')
const playback = require('../lib/playback')

process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error.message)
  console.error(error.stackTrace)
})

describe('Playback: ', function () {
  let app
  let sandbox
  let browser
  beforeEach('Spy on model', function () {
    sandbox = sinon.sandbox.create()
    sandbox.spy(serverModel, 'json')
  })
  beforeEach('Create app', function () {
    app = appFactory.create()
  })
  beforeEach('Launch browser', async function () {
    this.timeout('10s')
    browser = await puppeteer.launch()
  })
  afterEach('Close browser', function () {
    if (browser) browser.close()
  })
  afterEach('Close app', function () {
    app.close()
  })
  afterEach('Clean sandbox', function () {
    sandbox.restore()
  })
  it('We visit app', async function () {
    const page = await browser.newPage()
    await page.goto('http://localhost:3000')
    assert.ok(serverModel.json.notCalled)
  })

  it('We visit without caching and no body', async function () {
    const page = await browser.newPage()
    await page.goto('http://localhost:3000')
    assert.ok(serverModel.json.notCalled)
    page.on('console', msg => console.log('browser log', ...msg.args))
    const json = await page.evaluate(async function () {
      const result = await r2.post('http://localhost:3000/api/json').json
      return result
    })
    assert.deepEqual(json, {example: 1})
    assert.ok(serverModel.json.calledOnce)
    const json2 = await page.evaluate(async function () {
      const result = await r2.post('http://localhost:3000/api/json').json
      return result
    })
    assert.deepEqual(json2, {example: 1})
    assert.ok(serverModel.json.calledTwice)
  })
  it('Visit with caching and no body', async function () {
    const page = await browser.newPage()
    await page.goto('http://localhost:3000')
    const endPoint = browser.wsEndpoint()
    const options = url.parse(endPoint)
    const client = await new Promise(function (resolve, reject) {
      CDP({hosts: options.hostname, port: options.port}, function (client) {
        resolve(client)
      })
    })
    const interceptor = new playback.Interceptor({client})
    await interceptor.init()
    assert.ok(serverModel.json.notCalled)
    page.on('console', msg => console.log('browser log', ...msg.args))
    const json = await page.evaluate(async function () {
      const result = await r2.post('http://localhost:3000/api/json').json
      return result
    })
    assert.deepEqual(json, {example: 1})
    assert.ok(serverModel.json.calledOnce)

    const json2 = await page.evaluate(async function () {
      const result = await r2.post('http://localhost:3000/api/json').json
      return result
    })
    assert.deepEqual(json2, {example: 1})
    assert.ok(serverModel.json.calledOnce, 'Call should be cached')
  })
})
