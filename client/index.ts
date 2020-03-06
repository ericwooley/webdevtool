import 'xterm/css/xterm.css'
import { Terminal } from 'xterm'
import axios from 'axios'
import { w3cwebsocket as W3CWebSocket } from 'websocket'
import { FitAddon } from 'xterm-addon-fit'
interface ISettings {
  devToolHost: string
  apiPort: string
}
const windowSettings: Partial<ISettings> =
  ((window as any).devToolSettings as ISettings) || {}
export const Settings: ISettings = {
  devToolHost: windowSettings.devToolHost || 'localhost',
  apiPort: windowSettings.apiPort || '4306'
}
export const server = axios.create({
  baseURL: `http://${Settings.devToolHost}:${Settings.apiPort}`
})

async function main() {
  const { data: commandResponse } = await server.get('/run-command/1')
  console.log(commandResponse)
  var client = new W3CWebSocket(
    `ws://${Settings.devToolHost}:${commandResponse.port}/`,
    'echo-protocol'
  )

  client.onerror = function() {
    console.log('Connection Error')
  }

  client.onopen = function() {
    console.log('WebSocket Client Connected')
  }

  const term = new Terminal({})
  term.open(document.getElementById('terminal') as any)
  const fitAddon = new FitAddon()
  term.loadAddon(fitAddon)
  console.log({ cols: term.cols, rows: term.rows })
  // let response = ''
  // term.onKey(({ key }) => {
  //   if (key.charCodeAt(0) == 13) {
  //     term.write('\n')
  //     client.send(response)
  //     response = ''
  //   }
  //   response += key
  //   term.write(key)
  // })

  fitAddon.fit()

  client.onmessage = function(e) {
    if (typeof e.data === 'string') {
      term.write(e.data + '\n')
    }
  }
}
main().catch(e => console.error('startup error', e))
