import { Server } from 'ws'
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

interface IProcessTracker {
  [key: string]: {
    connection: WebSocket
    process: IPty
    terminal: ITerminal
  }
}
let requestNonce = 0
function killSessionProcesses(sessions: IProcessTracker) {
  const processList = Object.entries(sessions)
  console.log(`killing ${processList.length} processes.`)
  processList.forEach(([key, { process }]) => {
    stopProcess(process)
    delete sessions[key]
  })
}


process.on('SIGTERM', () => {
  console.log('SIGTERM signal received.')
  process.exit(143)
})
process.on('SIGINT', () => {
  console.log('SIGINT signal received.')
  process.exit(2)
})
export async function startWebsocketServer(config: IConfig, port: number) {
  const wsServer = new Server({
    port: port,
    perMessageDeflate: {
      zlibDeflateOptions: {
        // See zlib defaults.
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      // Other options settable:
      clientNoContextTakeover: true, // Defaults to negotiated value.
      serverNoContextTakeover: true, // Defaults to negotiated value.
      serverMaxWindowBits: 10, // Defaults to negotiated value.
      // Below options specified as default values.
      concurrencyLimit: 10, // Limits zlib concurrency for perf.
      threshold: 1024 // Size (in bytes) below which messages
      // should not be compressed.
    }
  })

  const connectionSessions: { [key: string]: IProcessTracker } = {}
  const closeAllSessionProcesses = () => {
    Object.values(connectionSessions)
      .filter(s => s)
      .forEach(killSessionProcesses)
  }


  process.on('exit', code => {
    closeAllSessionProcesses()
  })

  const terminals: ITerminal[] = config.sections
    .flatMap(section => {
      const { sections = [], ...flatSection } = section
      return [flatSection, ...sections]
    })
    .filter(s => s.type === 'terminal')
  wsServer.on('close', () => {
    process.exit()
  })
  wsServer.on('error', () => {
    process.exit(1)
  })
  wsServer.on('listening', () => {
    console.log(new Date() + ` Server is listening on port ${port}`)
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    rl.question('\n\npress enter to exit, SIGINT and SIGKILL may leave dangling processes\n\n', (answer: string) => {
      console.log('shutting down')
      rl.close()
      process.exit()
    })
  })
  // this is not a very memory efficient way to set this up, but this
  // should be single user, so I'm not too concerned at the moment.
  // If this project somehow morphs into something that has lots of users,
  // this will need to be reorganized.
  wsServer.on('connection', connection => {
    const requestId = `${++requestNonce}`

    const sessions: IProcessTracker = {}
    connectionSessions[requestId] = sessions
    console.log(new Date() + ' Connection accepted.')
    const sendMessage = (message: ISocketMessage) => {
      connection.send(JSON.stringify(message))
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
          connection: connection as any,
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
      const decoded: ISocketMessage<unknown> = JSON.parse(
        message.toString() || '{}'
      )
      if (!handlers[decoded.type as any])
        return connection.send(
          JSON.stringify({ error: 'unknown request for: ' + decoded.type })
        )
      handlers[decoded.type](decoded)
    })
    connection.on('close', function(reasonCode, description) {
      console.log('closed', { reasonCode, description })
      killSessionProcesses(sessions)
    })
  })
}
