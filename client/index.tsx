import React, { Component } from 'react'
import { render } from 'react-dom'
import { Spinner } from './components/spinner'
import { settings, server } from './settings'
import Dashboard from './components/dashboard'
import { IConfig } from '../interfaces'
import Socket from './socket'
export const socket = new Socket({})
class AppBody extends Component<
  {},
  {
    config?: IConfig
  }
> {
  constructor(props: any, context: any) {
    super(props, context)
    this.state = {}
  }
  async componentDidMount() {
    await this.loadSettings()
  }
  loadSettings = async () => {
    const { data }: { data: IConfig } = await server.get('/config')
    this.setState(s => ({
      loaded: true,
      config: data
    }))
    socket.setHost(settings.devToolHost)
    socket.setPort(`${data.wsPort}`)
    await socket.connect()
    this.forceUpdate()
  }
  render() {
    if (!this.state.config) return <Spinner />
    return (
      <Dashboard
        connected={socket.isConnected()}
        shortcuts={this.state.config.shortcuts}
        terminals={this.state.config.terminals}
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
