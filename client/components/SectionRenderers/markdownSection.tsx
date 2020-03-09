import React from 'react'
import { ISection } from '../../../interfaces'
import { IRenderSectionProps } from '../renderSection'
import Markdown from '../markdown'

export default class UrlSection extends React.Component<
  {
    section: ISection
  } & IRenderSectionProps,
  { running: boolean }
> {
  render() {
    return (
      <React.Fragment key={'markdown'}>
        {this.props.children({
          controls: (
            <div key={'markdown-controls' + this.props.section.id}></div>
          ),
          body: <Markdown>{this.props.section.value}</Markdown>
        })}
      </React.Fragment>
    )
  }
}
