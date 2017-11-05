const puppeteer = require('puppeteer')
const appFactory = require('./server/appFactory')
const serverModel = require('./server/model')
const sinon = require('sinon')
const assert = require('assert')
const r2 = require('r2')
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

  it('We visit, we do one post', async function () {
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
  })
})
