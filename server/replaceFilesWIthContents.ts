import { ISection } from '../interfaces'
import { randomBytes } from 'crypto'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'
interface FileObj {
  type: string
  path: string
}
const isFileObj = (value: any): value is FileObj => {
  if (!value) return false
  if (typeof value !== 'object') return false
  if (typeof value?.type !== 'string') return false
  if (typeof value?.path !== 'string') return false
  return true
}

export default function replaceFilesWithContents(
  sections: ISection[],
  configFilePath: string
): ISection[] {
  const basePath = dirname(configFilePath)
  return sections.map(s => {
    let value: string | FileObj = s.value
    if (isFileObj(value)) {
      const filePath = join(basePath, value.path)
      value = readFileSync(filePath).toString()
    }
    return {
      ...s,
      id: s.id || randomBytes(48).toString('hex'),
      value: value,
      sections: s.sections
        ? replaceFilesWithContents(s.sections, configFilePath)
        : undefined
    }
  })
}
