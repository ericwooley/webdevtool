import { COMMAND_TYPES } from './enums'

export interface IAutoId {
  name: string
  id?: string
}
export interface ValueObject {
  type: 'file'
  path: string
}
export interface ISection extends IAutoId {
  id: string
  type: string
  description?: string
  value: string // | ValueObject
  meta?: { columns?: number; [key: string]: unknown }
  sections?: ISection[]
}
export interface IShortcut extends ISection {}

export interface ITerminal extends ISection {
  interactive?: boolean
  autostart?: boolean
}

export interface IConfig {
  sections: ISection[]
  name: string
  brandColor: string
  logo: string
  port: number
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
