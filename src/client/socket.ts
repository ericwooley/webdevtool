// import { w3cwebsocket as W3CWebSocket } from 'websocket'
import Websocket from 'ws'
import { ISocketMessage } from '../interfaces'
interface IListener {
  (message: ISocketMessage): any
}
interface IListenerFilter {
  (message: ISocketMessage): boolean
}
interface IOpenListener {
  (): any
}
interface ICloseListener {
  (): any
}
export default class Socket {
  private client?: WebSocket
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
  private reconnectTimeout: number | null = null
  private clearReconnectTimeout = () => {
    if (this.reconnectTimeout !== null) clearTimeout(this.reconnectTimeout)
  }
  private establishConnection = (connected?: () => any) => {
    if (!this.host) throw new Error('Host must be set')
    if (!this.port) throw new Error('Port must be set')
    if (this.connected) return console.error('Socket already connected')
    if (this.preventConnection) return
    const wsServer = `ws://${this.host}:${this.port}/`
    console.log('connecting: ', wsServer)
    this.client = new WebSocket(wsServer, 'echo-protocol')
    this.client.onopen = () => {
      this.connected = true
      this.onOpenListeners.forEach(l => l())
      if (connected) {
        connected()
        connected = undefined
      }
    }
    this.client.onclose = e => {
      this.connected = false
      this.onCloseListeners.forEach(l => l())
      if (!this.preventConnection) {
        this.clearReconnectTimeout()
        this.reconnectTimeout = setTimeout(() => {
          this.client?.close()
          if (!this.preventConnection && !this.connected) {
            this.establishConnection()
          } else {
            this.clearReconnectTimeout()
          }
        }, 1000)
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
  private onOpenListeners: IOpenListener[] = []
  onOpen = (listener: IOpenListener) => {
    this.onOpenListeners.push(listener)
    return () => {
      this.onOpenListeners = this.onOpenListeners.filter(l => l !== listener)
      return null as any
    }
  }
  private onCloseListeners: ICloseListener[] = []
  onClose = (listener: ICloseListener) => {
    this.onCloseListeners.push(listener)
    return () => {
      this.onCloseListeners = this.onCloseListeners.filter(l => l !== listener)
      return null as any
    }
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
