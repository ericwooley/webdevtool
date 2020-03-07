import React, { Component } from 'react'
import { render } from 'react-dom'
import { Spinner } from './components/spinner'

import { server } from './settings'
import Dashboard from './components/dashboard'
import { IShortcut, ITerminal } from './interfaces'

class AppBody extends Component<
  {},
  {
    loaded: boolean
    terminals: ITerminal[]
    shortcuts: IShortcut[]
  }
> {
  async componentDidMount() {
    if (!this.state.loaded) {
      await this.loadSettings()
      this.setState(s => ({ ...s, loaded: true }))
    }
  }
  loadSettings = async () => {
    const { data } = await server.get('/config/')
    this.setState(s => ({
      ...s,
      shortcuts: data.shortcuts,
      terminals: data.terminals
    }))
    console.log('data', data)
  }
  state = {
    loaded: false,
    terminals: [],
    shortcuts: []
  }
  render() {
    if (!this.state.loaded) return <Spinner />
    return (
      <Dashboard
        shortcuts={this.state.shortcuts}
        terminals={this.state.terminals}
      ></Dashboard>
    )
  }
}
const App = () => <AppBody />
render(<App />, document.getElementById('root'))

// async function main() {
//   const { data: commandResponse } = await server.get('/run-command/1')
//   console.log(commandResponse)
//   var client = new W3CWebSocket(
//     `ws://${Settings.devToolHost}:${commandResponse.port}/`,
//     'echo-protocol'
//   )

//   client.onerror = function() {
//     console.log('Connection Error')
//   }

//   client.onopen = function() {
//     console.log('WebSocket Client Connected')
//   }

//   const term = new Terminal({})
//   term.open(document.getElementById('terminal') as any)
//   const fitAddon = new FitAddon()
//   term.loadAddon(fitAddon)
//   term.onKey(({ key }) => {
//     client.send(key)
//   })

//   fitAddon.fit()

//   client.onmessage = function(e) {
//     if (typeof e.data === 'string') {
//       term.write(e.data)
//     }
//   }
// }
// main().catch(e => console.error('startup error', e))
