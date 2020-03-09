import { COMMAND_TYPES } from './enums'

export interface IAutoId {
  name: string
  id?: string
}
export interface ISection extends IAutoId {
  id: string
  type: string
  value: string
  meta?: { [key: string]: unknown }
  sections?: ISection[]
}
export interface IShortcut extends ISection {}

export interface ITerminal extends ISection {
  interactive?: boolean
}

export interface IConfig {
  sections: ISection[]
  wsPort: number
  name: string
  brandColor: string
  logo: string
}

export interface IStartCommand {
  id: string
}

export interface ISocketMessage<
  T extends string | IStartCommand | unknown = unknown
> {
  sessionId: string
  type: COMMAND_TYPES
  payload: T
}
