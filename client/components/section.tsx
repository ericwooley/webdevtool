import React from 'react'
import { ISection } from '../../interfaces'
import { Avatar, Grid, Card, CardHeader, CardContent } from '@material-ui/core'
import TypeIcon from './typeIcon'
import RenderSection from './renderSection'

export default class Section extends React.Component<{
  section: ISection
  depth?: number
}> {
  render() {
    const { section, depth = 1 } = this.props
    return (
      <Grid item xs={Math.floor(12 / depth) as any}>
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
              <CardContent>{body}</CardContent>
              {section.sections && (
                <Grid container spacing={1} style={{ padding: 5 }}>
                  {section.sections.map(s => (
                    <Section section={s} depth={depth + 1} />
                  ))}
                </Grid>
              )}
            </Card>
          )}
        </RenderSection>
      </Grid>
    )
  }
}
