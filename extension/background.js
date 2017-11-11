window.localStorage.debug = 'playback:*'
const playback = require('../lib/playback')
const debug = require('debug')('playback:background')
const CDPE = require('../lib/extension-debugging-client')

const activeClients = {}

chrome.browserAction.onClicked.addListener(onClick)
chrome.tabs.onUpdated.addListener(function (tabId, change, tab) {
  if (!activeClients[tabId]) {
    chrome.browserAction.setIcon({tabId, path: './resources/play16.png'})
  }
})

async function onClick () {
  const tab = await new Promise(function (resolve, reject) {
    chrome.tabs.query({
      windowType: 'normal',
      active: true,
      lastFocusedWindow: true
    }, function (tabs) {
      resolve(tabs[0])
    })
  })
  debug('Selected tab', tab)
  if (activeClients[tab.id]) return cleanUpCaching(tab.id)
  setUpCaching(tab.id)
}
async function setUpCaching (tabId) {
  try {
    debug('Starting caching')
    chrome.browserAction.setIcon({tabId, path: './resources/playback16.png'})
    const client = await new Promise(function (resolve, reject) {
      CDPE({
        tabId: tabId
      }, function (err, client) {
        if (err) {
          return reject(err)
        }
        resolve(client)
      })
    })
    activeClients[tabId] = client

    const inspector = new playback.Interceptor({client})
    await inspector.init()
  } catch (e) {
    console.error(e)
    const client = activeClients[tabId]
    activeClients[tabId] = null
    chrome.browserAction.setIcon({tabId, path: './resources/play16.png'})
    if (client) client.clean()
  }
}

async function cleanUpCaching (tabId) {
  debug('Clearing caching')
  const client = activeClients[tabId]
  activeClients[tabId] = null
  chrome.browserAction.setIcon({tabId, path: './resources/play16.png'})
  client.clean()
}
