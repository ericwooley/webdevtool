import React from 'react'
import { ITerminal, ISocketMessage } from '../../../interfaces'
import 'xterm/css/xterm.css'
import { Terminal as XTerminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { server } from '../../settings'
import { COMMAND_TYPES } from '../../../enums'
import { socket } from '../..'
import { IRenderSectionProps } from '../renderSection'
import { ButtonGroup, Button } from '@material-ui/core'

export default class Terminal extends React.Component<
  {
    terminal: ITerminal
  } & IRenderSectionProps,
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
    return this.props.children({
      controls: (
        <div key={'terminal-controls'}>
          <ButtonGroup
            color="primary"
            aria-label="outlined primary button group"
          >
            <Button disabled>One</Button>
            <Button>Two</Button>
            <Button>Three</Button>
          </ButtonGroup>
          <ButtonGroup
            variant="contained"
            color="primary"
            aria-label="contained primary button group"
          >
            <Button>One</Button>
            <Button>Two</Button>
            <Button>Three</Button>
          </ButtonGroup>
        </div>
      ),
      body: <div key={'terminal-body'} ref={this.ref}></div>
    })
  }
}
