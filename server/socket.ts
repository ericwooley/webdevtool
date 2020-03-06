import { server as WebSocketServer, connection } from 'websocket'
import http from 'http'
import { spawn } from 'node-pty'

export async function runCommandOverWebsocket(
  { command, name }: { command: string; name: string },
  port: number
) {
  const server = http.createServer(function(request, response) {
    console.log(new Date() + ' Received request for ' + request.url)
    response.writeHead(404)
    response.end()
  })
  server.listen(port, function() {
    console.log(new Date() + ` Server is listening on port ${port}`)
  })

  const wsServer = new WebSocketServer({
    httpServer: server
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    // autoAcceptConnections: true
  })

  function originIsAllowed(origin: string) {
    // put logic here to detect whether the specified origin is allowed.
    return true
  }

  const connection = await new Promise<connection>(resolve =>
    wsServer.on('request', function requestListener(request) {
      if (!originIsAllowed(request.origin)) {
        // Make sure we only accept requests from an allowed origin
        request.reject()
        console.log(
          new Date() +
            ' Connection from origin ' +
            request.origin +
            ' rejected.'
        )
        return
      }

      const wsConnection = request.accept('echo-protocol', request.origin)
      console.log(new Date() + ' Connection accepted.')
      resolve(wsConnection)
      wsServer.removeListener('request', requestListener)
    })
  )

  console.log('runing command', command)
  const child = spawn('/bin/bash', ['-c', command], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.cwd(),
    env: process.env as any
  })
  child.on('data', data => {
    connection.sendUTF(data.toString())
  })
  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      child.write(message.utf8Data || '')
    } else if (message.type === 'binary') {
      connection.sendBytes(new Buffer('Dunder mifflin, this is Pam.'))
    }
  })
  const stop = async () => {
    child.kill()
    connection.close()
    wsServer.removeAllListeners()
    wsServer.closeAllConnections()
    wsServer.shutDown()
  }
  connection.on('close', function(reasonCode, description) {
    console.log('closed', reasonCode, description)
    stop()
  })
  return {
    port,
    command,
    stop
  }
}
