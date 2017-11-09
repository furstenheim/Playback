module.exports = {json, add}

function json () {
  return {example: 1}
}

function add (body) {
  return ++body.number
}
