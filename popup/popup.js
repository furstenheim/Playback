const html = require('choo/html')
const log = require('choo-log')
const choo = require('choo')
const playStates = {
  play: 'play',
  pause: 'pause',
  stop: 'stop',
  recording: 'recording'
}
const events = {
  changePlayState: 'changePlayState',
  render: 'render'
}


const app = choo()
app.use(log())
app.use(playbackStore)
app.route('/', mainView)
app.mount('body')

function mainView (state, emit) {
  return html`
    <body>
        <h1>State is ${state.playState}</h1>
    </body>
  `
}

function playbackStore (state, emitter) {
  state.playState = playStates.pause
  emitter.on(events.changePlayState, function (newState) {
    state.playState = newState
    emitter.emit(events.render)
  })
}
