import React, { Component } from 'react'
import { render } from 'react-dom'
import { Spinner } from './components/spinner'
import { settings, server } from './settings'
import Dashboard from './components/dashboard'
import { IConfig } from '../interfaces'
import Socket from './socket'
import { createMuiTheme, ThemeProvider } from '@material-ui/core'

export const socket = new Socket({})
const darkModeSettingsKey = `darkmode`
const darkTheme = createMuiTheme({
  palette: {
    type: 'dark'
  }
})
const lightTheme = createMuiTheme({
  palette: {
    type: 'light'
  }
})
class AppBody extends Component<
  {},
  {
    awaitingReconnect: boolean
    connected: boolean
    darkMode: boolean
    config?: IConfig
  }
> {
  constructor(props: any, context: any) {
    super(props, context)
    this.state = {
      darkMode: JSON.parse(
        localStorage.getItem(darkModeSettingsKey) || JSON.stringify(false)
      ),
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
  toggleDarkMode = () => {
    localStorage.setItem(
      darkModeSettingsKey,
      JSON.stringify(!this.state.darkMode)
    )
    this.setState({
      darkMode: !this.state.darkMode
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
      <ThemeProvider theme={this.state.darkMode ? darkTheme : lightTheme}>
        <Dashboard
          darkMode={this.state.darkMode}
          toggleDarkMode={this.toggleDarkMode}
          name={this.state.config.name}
          connected={this.state.connected}
          sections={this.state.config.sections}
        ></Dashboard>
      </ThemeProvider>
    )
  }
}
const App = () => <AppBody />
render(<App />, document.getElementById('root'))
