import { COMMAND_TYPES } from './enums'

export interface IAutoId {
  name: string
  id?: string
}
export interface IShortcut extends IAutoId {
  id: string
  url: string
}

export interface ITerminal extends IAutoId {
  id: string
  command: string
}

export interface ISection {
  name: string
  type: string
  value: string
  meta?: { [key: string]: unknown }
  sections?: ISection[]
}

export interface IConfig {
  sections: ISection[]
  terminals: ITerminal[]
  shortcuts: IShortcut[]
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
