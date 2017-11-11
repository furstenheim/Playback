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
    await Network.requestWillBeSent(function ({requestId, request}) {
      debug('Request will be sent for: ', request.url)
      // TODO dont save if already cached
      interceptor.requests[requestId] = {
        url: request.url,
        postData: request.postData
      }
    })
    debug('Network will be sent ready')
    await Network.responseReceived(async function ({requestId, response}) {
      debug('Reponse received for :', response.url)
      const responseBody = await Network.getResponseBody({requestId})
      console.log('Got response body')
      const requestInfo = interceptor.requests[requestId]
      const requestMemory = interceptor.memory[response.url] || {
        noPostData: null,
        byPostData: {}
      }
      debug('Caching response body: ', responseBody.body)
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
      delete interceptor.requests[requestId]
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
}

module.exports = {Interceptor}