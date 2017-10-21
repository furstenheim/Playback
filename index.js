const CDP = require('chrome-remote-interface')


main()

async function main () {
  const requests = {}
  CDP(async function (client) {
    let tab
    try {
      const {Network, Page} = client
      Network.requestWillBeSent(async function ({requestId, request, documentURL}) {
        if (request.method === 'POST') {
          console.log(requestId, documentURL)
          requests[requestId] = {
            request,
            documentURL
          }
        }
      })

      Network.responseReceived(async function ({requestId, response}) {
        if (requests[requestId]) {
          const body = await Network.getResponseBody({requestId})
          console.log(body)
          console.log(requests[requestId].request)
        }
      })
      await Promise.all([Network.enable(), Page.enable()])
      Page.navigate({url: 'https://www.github.com/trending'})
    } catch (e) {
      console.error(e)
    }
  })
}
