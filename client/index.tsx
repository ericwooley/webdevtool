import React, { Component } from 'react'
import { render } from 'react-dom'
import { Spinner } from './components/spinner'
import { settings, server } from './settings'
import Dashboard from './components/dashboard'
import { IConfig } from '../interfaces'
import Socket from './socket'
export const socket = new Socket({})
class AppBody extends Component<
  {},
  {
    awaitingReconnect: boolean
    connected: boolean
    config?: IConfig
  }
> {
  constructor(props: any, context: any) {
    super(props, context)
    this.state = {
      awaitingReconnect: false,
      connected: socket.isConnected()
    }
    this.clearCloseListener = socket.onClose(this.setSocketDisconnected)
    this.clearOpenListener = socket.onOpen(this.setSocketConnected)
  }
  clearCloseListener = () => null
  clearOpenListener = () => null
  componentWillUnmount() {
    this.clearCloseListener()
    this.clearOpenListener()
  }
  setSocketDisconnected = () =>
    this.setState({
      awaitingReconnect: true,
      connected: false
    })
  setSocketConnected = () => {
    this.loadSettings()
    this.setState({
      awaitingReconnect: false,
      connected: true
    })
  }
  async componentDidMount() {
    await this.loadSettings()
  }
  loadSettings = async () => {
    const { data }: { data: IConfig } = await server.get('/config')
    this.setState(s => ({
      ...s,
      loaded: true,
      config: data
    }))
    if (!socket.isConnected()) {
      socket.setHost(settings.devToolHost)
      socket.setPort(`${data.wsPort}`)
      await socket.connect()
      this.forceUpdate()
    }
  }
  render() {
    if (!this.state.config) return <Spinner />
    return (
      <Dashboard
        name={this.state.config.name}
        connected={this.state.connected}
        sections={this.state.config.sections}
      ></Dashboard>
    )
  }
}
const App = () => <AppBody />
render(<App />, document.getElementById('root'))
