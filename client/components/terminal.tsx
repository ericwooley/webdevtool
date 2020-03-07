import React from 'react'
import { ITerminal, ISocketMessage } from '../../interfaces'
import 'xterm/css/xterm.css'
import { Terminal as XTerminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { server } from '../settings'
import { Paper, Typography, Button } from '@material-ui/core'
import KeyboardIcon from '@material-ui/icons/Keyboard'
import Socket from '../socket'
import { COMMAND_TYPES } from '../../enums'
import { socket } from '../'
export default class Terminal extends React.Component<
  {
    terminal: ITerminal
    terminalID: number | string
  },
  { running: boolean }
> {
  state = { running: false }
  term = new XTerminal({})
  removeSocketListener: () => any = () => undefined
  componentWillUnmount() {
    this.term.dispose()
    this.removeSocketListener()
  }
  connectTerminal = async () => {
    const { data: sessionId }: { data: string } = await server.get(
      '/generateSessionId'
    )
    this.setState(s => ({ ...s, running: true }))
    const term = this.term
    if (this.ref && this.ref.current) {
      term.open(this.ref.current)
      const fitAddon = new FitAddon()
      term.loadAddon(fitAddon)
      term.onKey(({ key }) => {
        socket.sendMessage({
          sessionId,
          type: COMMAND_TYPES.WRITE_STDIN,
          payload: key
        })
      })

      fitAddon.fit()
    }
    this.removeSocketListener = socket.addListener(
      (message: ISocketMessage) => {
        if (typeof message.payload !== 'string') return
        term.write(message.payload)
      },
      message => {
        return (
          message.type === COMMAND_TYPES.WRITE_STDOUT &&
          message.sessionId === sessionId
        )
      }
    )
    socket.sendMessage({
      sessionId,
      type: COMMAND_TYPES.START_SESSION,
      payload: this.props.terminal
    })
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
