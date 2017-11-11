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
  console.error(error.stack)
})

describe('Playback: ', function () {
  let app
  let sandbox
  let browser
  beforeEach('Spy on model', function () {
    sandbox = sinon.sandbox.create()
    sandbox.spy(serverModel, 'json')
    sandbox.spy(serverModel, 'add')
  })
  beforeEach('Create app', function () {
    app = appFactory.create()
  })
  beforeEach('Launch browser', async function () {
    this.timeout('30s')
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
    client.on('error', function (err) {
      console.error('Error with client', err)
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

  it('Get with caching and no body', async function () {
    const page = await browser.newPage()
    await page.goto('http://localhost:3000')
    const endPoint = browser.wsEndpoint()
    const options = url.parse(endPoint)
    const client = await new Promise(function (resolve, reject) {
      CDP({hosts: options.hostname, port: options.port}, function (client) {
        resolve(client)
      })
    })
    client.on('error', function (err) {
      console.error('Error with client', err)
    })
    const interceptor = new playback.Interceptor({client})
    await interceptor.init()
    assert.ok(serverModel.json.notCalled)
    page.on('console', msg => console.log('browser log', ...msg.args))
    const json = await page.evaluate(async function () {
      const result = await r2.get('http://localhost:3000/api/json').json
      return result
    })
    assert.deepEqual(json, {example: 1})
    assert.ok(serverModel.json.calledOnce)

    const json2 = await page.evaluate(async function () {
      const result = await r2.get('http://localhost:3000/api/json').json
      return result
    })
    assert.deepEqual(json2, {example: 1})
    console.log(serverModel.json.calledOnce)
    assert.ok(serverModel.json.calledTwice, 'Get should not be cached')
  })
  it('Visit with no caching and body ', async function () {
    const page = await browser.newPage()
    await page.goto('http://localhost:3000')
    assert.ok(serverModel.add.notCalled)
    page.on('console', msg => console.log('browser log', ...msg.args))
    const json = await page.evaluate(async function () {
      const result = await r2.post('http://localhost:3000/api/add', {json: {number: 1}}).json
      return result
    })
    assert.deepEqual(json, 2)
    assert.ok(serverModel.add.calledOnce)

    const json2 = await page.evaluate(async function () {
      const result = await r2.post('http://localhost:3000/api/add', {json: {number: 3}}).json
      return result
    })
    assert.deepEqual(json2, 4)
    assert.ok(serverModel.add.calledTwice, 'Call should not be cached')
    const json3 = await page.evaluate(async function () {
      const result = await r2.post('http://localhost:3000/api/add', {json: {number: 8}}).json
      return result
    })
    assert.deepEqual(json3, 9)
    assert.ok(serverModel.add.calledThrice, 'Call should not be cached')
  })

  it('Visit with caching and body ', async function () {
    const page = await browser.newPage()
    await page.goto('http://localhost:3000')
    const endPoint = browser.wsEndpoint()
    const options = url.parse(endPoint)
    const client = await new Promise(function (resolve, reject) {
      CDP({hosts: options.hostname, port: options.port}, function (client) {
        resolve(client)
      })
    })
    client.on('error', function (err) {
      console.error('Error with client', err)
    })
    const interceptor = new playback.Interceptor({client})
    await interceptor.init()
    assert.ok(serverModel.add.notCalled)
    page.on('console', msg => console.log('browser log', ...msg.args))
    const json = await page.evaluate(async function () {
      const result = await r2.post('http://localhost:3000/api/add', {json: {number: 1}}).json
      return result
    })
    assert.deepEqual(json, 2)
    assert.ok(serverModel.add.calledOnce)

    const json2 = await page.evaluate(async function () {
      const result = await r2.post('http://localhost:3000/api/add', {json: {number: 3}}).json
      return result
    })
    assert.deepEqual(json2, 4)
    assert.ok(serverModel.add.calledTwice, 'Call should not be cached')
    const json3 = await page.evaluate(async function () {
      const result = await r2.post('http://localhost:3000/api/add', {json: {number: 1}}).json
      return result
    })
    assert.deepEqual(json3, 2)
    assert.ok(serverModel.add.calledTwice, 'Call should be cached')
  })
})
