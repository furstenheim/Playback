const r2 = require('r2')
window.r2 = r2
window.loadJson = async function () {
  const result = await r2.post('http://localhost:3000/api/add', {json: {number: 3}}).json
  console.log(result)
}
