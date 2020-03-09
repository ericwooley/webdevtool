import { ISection } from '../interfaces'
import { randomBytes } from 'crypto'

export default function generateSectionIds(sections: ISection[]): ISection[] {
  return sections.map(s => ({
    ...s,
    id: s.id || randomBytes(48).toString('hex'),
    sections: s.sections ? generateSectionIds(s.sections) : undefined
  }))
}
