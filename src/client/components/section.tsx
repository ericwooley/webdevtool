import React from 'react'
import { ISection } from '../../interfaces'
import Avatar from '@material-ui/core/Avatar'
import Grid from '@material-ui/core/Grid'
import Card from '@material-ui/core/Card'
import CardHeader from '@material-ui/core/CardHeader'
import CardContent from '@material-ui/core/CardContent'
import Divider from '@material-ui/core/Divider'
import TypeIcon from './typeIcon'
import RenderSection from './renderSection'
import Markdown from './markdown'
import Switch from '@material-ui/core/Switch'
import { Typography } from '@material-ui/core'

export default class Section extends React.Component<
  {
    section: ISection
    depth?: number
  },
  {
    descriptionVisible: boolean
    contentVisible: boolean
  }
> {
  state = {
    descriptionVisible: false,
    contentVisible: true
  }
  toggleDescription = () => {
    this.setState(s => ({
      ...s,
      descriptionVisible: !s.descriptionVisible
    }))
  }
  toggleContent = () => {
    this.setState(s => ({
      ...s,
      contentVisible: !s.contentVisible
    }))
  }
  render() {
    const { section, depth = 1 } = this.props
    const defaultColumns = depth > 1 ? 6 : 12
    const columns =
      typeof section.meta?.columns === 'number'
        ? section.meta?.columns
        : defaultColumns
    return (
      <Grid item xs={12} sm={12} md={12} lg={columns as any}>
        <RenderSection section={section}>
          {({ controls, body }) => (
            <Card elevation={depth}>
              <CardHeader
                avatar={
                  <Avatar aria-label="recipe">
                    <TypeIcon type={section.type} />
                  </Avatar>
                }
                action={controls}
                title={section.name}
                subheader={section.type}
              />
              {section.description && (
                <>
                  <CardContent>
                    <Typography align="right">
                      {!this.state.descriptionVisible && `${this.props.section.name} description hidden`}
                      <Switch
                        checked={this.state.descriptionVisible}
                        onChange={this.toggleDescription}
                      />
                    </Typography>
                    <div
                      style={{
                        display: this.state.descriptionVisible
                          ? undefined
                          : 'none'
                      }}
                    >
                      <Markdown>{section.description}</Markdown>
                    </div>
                  </CardContent>
                  <Divider />
                </>
              )}
              <CardContent>
                <Typography align="right">
                  {!this.state.contentVisible && `${this.props.section.name} hidden`}
                  <Switch

                    checked={this.state.contentVisible}
                    onChange={this.toggleContent}
                  />
                </Typography>
                <div
                  style={{
                    display: this.state.contentVisible ? undefined : 'none'
                  }}
                >
                  {body}
                </div>
              </CardContent>
              {section.sections && (
                <Grid container spacing={1} style={{ padding: 5 }}>
                  {section.sections.map(s => {
                    return <Section key={s.id} section={s} depth={depth + 1} />
                  })}
                </Grid>
              )}
            </Card>
          )}
        </RenderSection>
      </Grid>
    )
  }
}
