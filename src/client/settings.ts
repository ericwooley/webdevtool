import axios from 'axios'
interface ISettings {
  devToolHost: string
  apiPort: string
}
const windowSettings: Partial<ISettings> =
  ((window as any).devToolSettings as ISettings) || {}
export const settings: ISettings = {
  devToolHost: windowSettings.devToolHost || 'localhost',
  apiPort: windowSettings.apiPort || '4306'
}
export const server = axios.create({
  baseURL: `http://${settings.devToolHost}:${settings.apiPort}`
})
