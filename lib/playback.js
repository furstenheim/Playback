class Interceptor {
  constructor ({client, db}) {
    const interceptor = this
    // mainly so it does not polute the logs
    Object.defineProperty(interceptor, 'client', {enumerable: false, value: client})
    Object.defineProperty(interceptor, 'db', {enumerable: false, value: db})
  }


}

module.exports = {Interceptor}