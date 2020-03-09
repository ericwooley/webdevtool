import React from 'react'
import { ISection } from '../../interfaces'
import Terminal from './SectionRenderers/terminal'
import Section from './section'

export interface IRenderSectionProps {
  section: ISection
  children: (callbackProps: {
    controls: React.ReactNode
    body: React.ReactNode
  }) => React.ReactNode
}

class UnknownType extends React.PureComponent<IRenderSectionProps> {
  render() {
    return this.props.children({
      controls: <div>{this.props.section.type} Controls</div>,
      body: <div>{this.props.section.type} Body</div>
    })
  }
}
export default class RenderSection extends React.PureComponent<
  IRenderSectionProps
> {
  getSectionType = () => {
    switch (this.props.section.type) {
      case 'terminal':
        return Terminal
      default:
        return UnknownType
    }
  }
  render() {
    const SectionComponent = this.getSectionType()
    return (
      <SectionComponent key={this.props.section.type} section={this.props.section}>
        {this.props.children}
      </SectionComponent>
    )
  }
}
