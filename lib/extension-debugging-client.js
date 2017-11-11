module.exports = ChromeClient
const debug = require('debug')('playback:debugging-client')

function ChromeClient (debuggee, callback) {
  chrome.debugger.attach(debuggee, '1.2', function () {
    const targetId = debuggee.id
    const listeners = {}

    function listener (source, method, params) {
      if (source.targetId === targetId && listeners[method]) {
        debug('Recognized event: ', method)
        listeners[method](params)
      }
    }

    // TODO clean on disconnect
    chrome.debugger.onEvent.addListener(listener)
    const client = {
      Network: {
        enable () {
          return chrome.debugger.sendCommand(debuggee, 'Network.enable')
        },
        setRequestInterceptionEnabled (params) {
          return chrome.debugger.sendCommand(debuggee, 'Network.setRequestInterceptionEnabled', params)
        },
        responseReceived (callback) {
          listeners['Network.responseReceived'] = callback
        },
        requestWillBeSent (callback) {
          listeners['Network.requestWillBeSent'] = callback
        },
        requestIntercepted (callback) {
          listeners['Network.requestIntercepted'] = callback
        },
        getResponseBody (params) {
          return new Promise(function (resolve, reject) {
            chrome.debugger.sendCommand(debuggee, 'Network.getResponseBody', params, function (response) {
              resolve(response)
            })
          })
        },
        continueInterceptedRequest (params) {
          return chrome.debugger.sendCommand(debuggee, 'Network.continueInterceptedRequest', params)
        }
      }
    }
    callback(client)
  })
}
