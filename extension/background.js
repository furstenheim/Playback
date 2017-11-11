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

async function onClick (tab) {
  /*const tab = await new Promise(function (resolve, reject) {
    chrome.tabs.query({
      windowType: 'normal',
      active: true,
      lastFocusedWindow: true
    }, function (tabs) {
      resolve(tabs[0])
    })
  })*/
  debug('Selected tab', tab)
  if (activeClients[tab.id]) return cleanUpCaching(tab.id)
  setUpCaching(tab.id)
}
async function setUpCaching (tabId) {
  debug('Starting caching')
  activeClients[tabId] = {}
  chrome.browserAction.setIcon({tabId, path: './resources/playback16.png'})
  const client = await new Promise(function (resolve, reject) {
    CDPE({
      tabId: tabId
    }, client => resolve(client))
  })

  const inspector = new playback.Interceptor({client})
  await inspector.init()
}

async function cleanUpCaching (tabId) {
  debug('Clearing caching')
  activeClients[tabId] = null
  chrome.browserAction.setIcon({tabId, path: './resources/play16.png'})
}



