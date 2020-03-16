import axios from 'axios'
interface ISettings {
  devToolHost: string
  apiPort: string
}
const windowSettings: Partial<ISettings> =
  ((window as any).devToolSettings as ISettings) || {}
const defaultHost = window.location.hostname
const defaultPort = window.location.port
export const settings: ISettings = {
  devToolHost: windowSettings.devToolHost || defaultHost,
  apiPort: windowSettings.apiPort || defaultPort
}

export const server = axios.create({
  // baseURL: `http://${settings.devToolHost}:${settings.apiPort}`
})
