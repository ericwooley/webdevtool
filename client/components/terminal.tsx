import React from 'react'
import { ITerminal } from '../interfaces'
import 'xterm/css/xterm.css'
import { Terminal as XTerminal } from 'xterm'
import { w3cwebsocket as W3CWebSocket } from 'websocket'
import { FitAddon } from 'xterm-addon-fit'
import { settings, server } from '../settings'
import { Paper, Typography, Button } from '@material-ui/core'
import KeyboardIcon from '@material-ui/icons/Keyboard'

export default class Terminal extends React.PureComponent<
  {
    terminal: ITerminal
    terminalID: number | string
  },
  { running: boolean }
> {
  state = { running: false }
  connectTerminal = async () => {
    this.setState(s => ({ ...s, running: true }))
    const { data: commandResponse } = await server.get(
      `/run-command/${this.props.terminalID}`
    )
    console.log(commandResponse)
    var client = new W3CWebSocket(
      `ws://${settings.devToolHost}:${commandResponse.port}/`,
      'echo-protocol'
    )

    client.onerror = () => {
      console.log('Connection Error')
      this.setState(s => ({ ...s, running: false }))
    }

    client.onopen = () => {
      console.log('WebSocket Client Connected')
    }

    const term = new XTerminal({})
    if (this.ref && this.ref.current) {
      term.open(this.ref.current)
      const fitAddon = new FitAddon()
      term.loadAddon(fitAddon)
      term.onKey(({ key }) => {
        client.send(key)
      })

      fitAddon.fit()

      client.onmessage = function(e) {
        if (typeof e.data === 'string') {
          term.write(e.data)
        }
      }
    }
  }
  ref: React.RefObject<HTMLDivElement> = React.createRef()
  render() {
    return (
      <Paper>
        <div>
          <Typography>
            <Button
              onClick={this.connectTerminal}
              disabled={this.state.running}
            >
              <KeyboardIcon />
            </Button>
            {this.props.terminal.name}
          </Typography>
        </div>
        <div ref={this.ref}></div>
      </Paper>
    )
  }
}
