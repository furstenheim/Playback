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
    const interceptor = this
    const {Network} = interceptor.client
    await Network.requestWillBeSent(function ({requestId, request}) {
      // TODO dont save if already cached
      interceptor.requests[requestId] = {
        url: request.url,
        postData: request.postData
      }
    })
    await Network.responseReceived(async function ({requestId, response}) {
      const responseBody = await Network.getResponseBody({requestId})
      const requestInfo = interceptor.requests[requestId]
      const requestMemory = interceptor.memory[response.url] || {
        noPostData: null,
        byPostData: {}
      }
      const infoToCache = {
        responseBody,
        response,
        rawResponse: response.headersText + responseBody
      }
      if (requestInfo.postData) {
        requestMemory.byPostData[requestInfo.postData] = infoToCache
      } else {
        requestMemory.noPostData = infoToCache
      }
      delete interceptor.requests[requestId]
    })
    await Network.requestIntercepted(function ({interceptionId, request}) {
      const cachedByUrl = interceptor.memory[request.url]
      if (!cachedByUrl) {
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
      }
    })
    return Network.enable()
  }
}

module.exports = {Interceptor}