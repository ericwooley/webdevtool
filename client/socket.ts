import { w3cwebsocket as W3CWebSocket } from 'websocket'
import { ISocketMessage } from '../interfaces'
interface IListener {
  (message: ISocketMessage): any
}
interface IListenerFilter {
  (message: ISocketMessage): boolean
}
export default class Socket {
  private client?: W3CWebSocket
  private connected: boolean = false
  private host: string
  private port: string

  private preventConnection: boolean = false
  private messageListeners: {
    filter?: IListenerFilter
    listener: IListener
  }[] = []
  isConnected = () => this.connected
  constructor({ host, port }: { host?: string; port?: number | string } = {}) {
    this.host = host || ''
    this.port = `${port}` || ''
  }

  connect = () => {
    this.preventConnection = false
    return new Promise(r => {
      this.establishConnection(r)
    })
  }
  disconnect = () => {
    this.preventConnection = true
    this.client?.close()
  }
  setHost = (host: string) => {
    this.host = host
  }
  setPort = (port: string) => {
    this.port = port
  }
  private reconnectInterval: number | null = null
  private clearReconnectInterval = () => {
    if (this.reconnectInterval !== null) clearInterval(this.reconnectInterval)
  }
  private establishConnection = (connected?: () => any) => {
    if (!this.host) throw new Error('Host must be set')
    if (!this.port) throw new Error('Port must be set')
    if (this.connected) return console.error('Socket already connected')
    if (this.preventConnection) return
    const wsServer = `ws://${this.host}:${this.port}/`
    console.log('connecting: ', wsServer)
    this.client = new W3CWebSocket(wsServer, 'echo-protocol')
    this.client.onopen = () => {
      console.log('connected')
      this.connected = true
      if (connected) {
        connected()
        connected = undefined
      }
    }
    this.client.onclose = (e) => {
      console.log('disconnected')
      this.connected = false
      if (!this.preventConnection) {
        this.clearReconnectInterval()
        this.reconnectInterval = setInterval(() => {
          if (!this.preventConnection && !this.connected) {
            this.establishConnection()
          } else {
            this.clearReconnectInterval()
          }
        }, 5000)
      }
    }
    this.client.onmessage = e => {
      if (typeof e.data === 'string') {
        const message: ISocketMessage = JSON.parse(e.data)
        this.messageListeners.forEach(({ listener, filter }) => {
          if (!filter || filter(message)) listener(message)
        })
      }
    }
  }
  sendMessage = (message: ISocketMessage) => {
    this.client?.send(JSON.stringify(message))
  }
  addListener = (listener: IListener, filter?: IListenerFilter) => {
    const l = {
      listener,
      filter
    }
    this.messageListeners.push(l)
    return () => {
      this.messageListeners = this.messageListeners.filter(o => o !== l)
    }
  }
}
