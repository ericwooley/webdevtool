import React from 'react'
import { ISection } from '../../../interfaces'

import { IRenderSectionProps } from '../renderSection'
import OpenInBrowserIcon from '@material-ui/icons/OpenInBrowser'
import { Button, Link } from '@material-ui/core'
import styled from 'styled-components'

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
              <Button variant="contained" color="primary">
                <Link
                  style={{ color: 'white' }}
                  href={this.props.section.value}
                  target="_blank"
                >
                  <OpenInBrowserIcon />
                </Link>
              </Button>
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
