import React from 'react'
import { ISection } from '../../../interfaces'

import { IRenderSectionProps } from '../renderSection'
import OpenInBrowserIcon from '@material-ui/icons/OpenInBrowser'
import Link from '@material-ui/core/Link'
import Button from '@material-ui/core/Button'

export default class UrlSection extends React.Component<
  {
    section: ISection
  } & IRenderSectionProps,
  { running: boolean }
> {
  render() {
    return (
      <React.Fragment key={'terminal'}>
        {this.props.children({
          controls: (
            <div key={'terminal-controls' + this.props.section.id}>
              <Link
                href={this.props.section.value}
                target="_blank"
              >
                <Button>
                  <OpenInBrowserIcon />
                </Button>
              </Link>
            </div>
          ),
          body: (
            <Link href={this.props.section.value}>
              {this.props.section.name}
            </Link>
          )
        })}
      </React.Fragment>
    )
  }
}
