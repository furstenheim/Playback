localStorage.debug = 'playback:*'
const playback = require('../lib/playback')
const CDP = require('chrome-remote-interface')
const CDPE = require('../lib/extension-debugging-client')
async function setUpCaching () {
  console.log('Starting caching')
  const tab = await new Promise(function (resolve, reject) {
    chrome.tabs.query({
      windowType: 'normal',
      active: true,
      lastFocusedWindow: true
    }, function (tabs) {
      resolve(tabs[0])
    })
  })
  console.log(tab)
  const targets = await new Promise(function (resolve, reject) {
    chrome.debugger.getTargets(function (targets) {
      resolve(targets)
    })
  })
  // TODO err
  const target = targets.find(t => t.tabId === tab.id)
  console.log(targets)
  /*const client = await new Promise(function (resolve, reject) {
    CDP({
      target: function (targets) {
        console.log(targets)
        const remoteTarget = targets.find(t => t.id === target.id)
        // TODO err
        console.log(remoteTarget)
        return remoteTarget
      }
    }, client => resolve(client))
  })*/
  const client = await new Promise(function (resolve, reject) {
    CDPE({
      tabId: tab.id
    }, client => resolve(client))
  })

  const inspector = new playback.Interceptor({client})
  await inspector.init()
}
chrome.browserAction.onClicked.addListener(setUpCaching)
