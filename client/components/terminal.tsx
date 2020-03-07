import React from 'react'
import { ITerminal } from '../interfaces'
import 'xterm/css/xterm.css'
import { Terminal as XTerminal } from 'xterm'
import { w3cwebsocket as W3CWebSocket } from 'websocket'
import { FitAddon } from 'xterm-addon-fit'
import { settings, server } from '../settings'
import { Paper, Typography } from '@material-ui/core'
import KeyboardIcon from '@material-ui/icons/Keyboard'

export default class Terminal extends React.PureComponent<{
  terminal: ITerminal
  terminalID: number | string
}> {
  connectTerminal = async () => {
    const { data: commandResponse } = await server.get(
      `/run-command/${this.props.terminalID}`
    )
    console.log(commandResponse)
    var client = new W3CWebSocket(
      `ws://${settings.devToolHost}:${commandResponse.port}/`,
      'echo-protocol'
    )

    client.onerror = function() {
      console.log('Connection Error')
    }

    client.onopen = function() {
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
          <Typography><KeyboardIcon onClick={this.connectTerminal} /> {this.props.terminal.name}</Typography>
        </div>
        <div ref={this.ref}></div>
      </Paper>
    )
  }
}
