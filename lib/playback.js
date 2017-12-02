const btoaLibrary = require('btoa')
let btoaFunction = btoaLibrary
if (typeof btoa !== 'undefined') {
  btoaFunction = btoaLibrary
}
const debug = require('debug')('playback:Interceptor')
class Interceptor {
  constructor ({client}) {
    const interceptor = this
    // mainly so it does not polute the logs
    Object.defineProperty(interceptor, 'client', {enumerable: false, value: client})
    interceptor.memory = {}
    interceptor.requests = {}
    interceptor.state = {
      isRecording: true,
      isPlaying: true
    }
  }

  async init () {
    debug('Starting init')
    const interceptor = this
    const {Network} = interceptor.client
    await Network.requestWillBeSent(interceptor.requestWillBeSentHandler.bind(interceptor))
    debug('Network will be sent ready')
    await Network.responseReceived(async function ({requestId, response}) {
      debug('Reponse received for :', response.url)
      const responsePromise = Network.getResponseBody({requestId})
      let requestInfo = interceptor.requests[requestId]

      if (!requestInfo) {
        debug('Request was not registered. Probably a race condition')
        let r
        const wait = new Promise(function (resolve) {
          r = resolve
        })
        interceptor.requests[requestId] = r
        // Basically we wait till Network will be sent is registered, so that we have the info
        await wait
        debug('Getting request info for the value after the wait')
        requestInfo = interceptor.requests[requestId]
      }
      // We delete before waiting in case it never fulfills
      delete interceptor.requests[requestId]

      // If request is not interested we save -1
      if (requestInfo === -1) {
        return
      }
      try {
        const responseBody = await responsePromise
        debug('Got response body')
        const requestMemory = interceptor.memory[response.url] || {
          noPostData: null,
          byPostData: {}
        }
        debug('Caching response body')
        const infoToCache = {
          responseBody,
          response,
          rawResponse: btoaFunction(response.headersText + responseBody.body)
        }
        if (requestInfo.postData) {
          requestMemory.byPostData[requestInfo.postData] = infoToCache
        } else {
          requestMemory.noPostData = infoToCache
        }
        interceptor.memory[response.url] = requestMemory
      } catch (e) {
        console.error('Could not get response body', e)
      }
    })
    debug('Network response received ready')
    await Network.requestIntercepted(function ({interceptionId, request}) {
      debug('Request intercepted: ', request.url)
      const cachedByUrl = interceptor.memory[request.url]
      if (!cachedByUrl) {
        debug('Response was not cached')
        return Network.continueInterceptedRequest({interceptionId})
      }
      let cached
      if (!request.postData && cachedByUrl.noPostData) {
        cached = cachedByUrl.noPostData
      } else if (request.postData && cachedByUrl.byPostData[request.postData]) {
        cached = cachedByUrl.byPostData[request.postData]
      } else {
        return Network.continueInterceptedRequest({interceptionId})
      }
      Network.continueInterceptedRequest({
        interceptionId,
        rawResponse: cached.rawResponse
      })
    })
    debug('Network requested intercepted ready')
    Network.enable()
    debug('Network enabled ready')
    Network.setRequestInterceptionEnabled({enabled: true})
    debug('Network request intercept ready')
  }
  // Not ideal, but we need to expose the method so that we can test race conditions
  requestWillBeSentHandler ({requestId, request}) {
    debug('Request will be sent for: ', request.url)
    const responseReceivedWaiting = this.requests[requestId]

    if (typeof responseReceivedWaiting === 'function') {
      debug('Response was received earlier')
      responseReceivedWaiting()
    }

    if (request.method !== 'POST') {
      debug('Only POST methods are cached')
      // We save -1 so that responseReceived knows that we are not interested
      this.requests[requestId] = -1
      return
    }
    // TODO dont save if already cached
    this.requests[requestId] = {
      url: request.url,
      postData: request.postData
    }
  }

}

module.exports = {Interceptor}