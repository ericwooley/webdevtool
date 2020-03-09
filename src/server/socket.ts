import { server as WebSocketServer, connection } from 'websocket'
import http from 'http'
import { spawn, IPty } from 'node-pty'
import {
  IConfig,
  ISocketMessage,
  IStartCommand,
  ITerminal
} from '../interfaces'
import { COMMAND_TYPES } from '../enums'
const stopProcess = (p: IPty) => {
  p.kill()
}
export async function startWebsocketServer(config: IConfig, port: number) {
  const terminals: ITerminal[] = config.sections
    .flatMap(section => {
      const { sections = [], ...flatSection } = section
      return [flatSection, ...sections]
    })
    .filter(s => s.type === 'terminal')
  const server = http.createServer(function(request, response) {
    console.log(new Date() + ' Received request for ' + request.url)
    // response.writeHead(404)
    // response.end()
  })
  server.listen(port, function() {
    console.log(new Date() + ` Server is listening on port ${port}`)
  })

  const wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
  })

  function originIsAllowed(origin: string) {
    // put logic here to detect whether the specified origin is allowed.
    return true
  }

  // this is not a very memory efficient way to set this up, but this
  // should be single user, so I'm not too concerned at the moment.
  // If this project somehow morphs into something that has lots of users,
  // this will need to be reorganized.
  wsServer.on('request', function requestListener(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject()
      console.log(
        new Date() + ' Connection from origin ' + request.origin + ' rejected.'
      )
      return
    }

    const sessions: {
      [key: string]: {
        connection: connection
        process: IPty
        terminal: ITerminal
      }
    } = {}
    const connection = request.accept('echo-protocol', request.origin)
    console.log(new Date() + ' Connection accepted.')
    const sendMessage = (message: ISocketMessage) => {
      connection.sendUTF(JSON.stringify(message))
    }

    const handlers: {
      [key: string]: (payload: ISocketMessage<any>) => Promise<any>
    } = {
      [COMMAND_TYPES.START_SESSION]: async (
        message: ISocketMessage<IStartCommand>
      ) => {
        const terminal = terminals.find(({ id }) => message.payload.id === id)
        if (!terminal) {
          return sendMessage({
            ...message,
            type: COMMAND_TYPES.ERROR,
            payload: 'Command not found'
          })
        }

        const child = spawn(
          '/bin/bash',
          ['-c', terminal.interactive ? '$(which $SHELL)' : terminal.value],
          {
            name: 'xterm-color',
            cols: 80,
            rows: 30,
            env: process.env as any
          }
        )
        if (terminal.interactive) {
          child.write(terminal.value + '\n')
        }
        child.on('data', data => {
          sendMessage({
            ...message,
            type: COMMAND_TYPES.WRITE_STDOUT,
            payload: data
          })
        })
        sessions[message.sessionId] = {
          connection,
          process: child,
          terminal
        }
      },
      [COMMAND_TYPES.STOP_SESSION]: async (message: ISocketMessage) => {
        const session = sessions[message.sessionId]
        if (!session)
          return sendMessage({
            ...message,
            type: COMMAND_TYPES.ERROR,
            payload: 'Session not found'
          })
        stopProcess(session.process)
        delete sessions[message.sessionId]
      },
      [COMMAND_TYPES.WRITE_STDIN]: async (message: ISocketMessage) => {
        const session = sessions[message.sessionId]
        if (!session)
          return sendMessage({
            ...message,
            type: COMMAND_TYPES.ERROR,
            payload: 'Session not found'
          })
        if (typeof message.payload !== 'string')
          return sendMessage({
            ...message,
            type: COMMAND_TYPES.ERROR,
            payload: 'Session not found'
          })
        if (session.terminal.interactive) session.process.write(message.payload)
      }
    }
    connection.on('message', function(message) {
      if (message.type === 'utf8') {
        const decoded: ISocketMessage<unknown> = JSON.parse(
          message.utf8Data || '{}'
        )
        if (!decoded.type)
          return connection.sendUTF(
            JSON.stringify({ error: 'malformed request' })
          )
        if (!handlers[decoded.type as any])
          return connection.sendUTF(
            JSON.stringify({ error: 'unknown request for: ' + decoded.type })
          )
        handlers[decoded.type](decoded)
        // child.write(message.utf8Data || '')
      } else if (message.type === 'binary') {
        connection.sendBytes(new Buffer('Dunder mifflin, this is Pam.'))
      }
    })
    connection.on('close', function(reasonCode, description) {
      console.log('closed', { reasonCode, description })
      Object.entries(sessions).forEach(([key, session]) => {
        stopProcess(session.process)
      })
    })
  })
}
