import React from 'react'
import ReactMarkdown from 'react-markdown'

export default class Markdown extends React.PureComponent<{
  children: string
}> {
  render() {
    return <ReactMarkdown source={this.props.children} />
  }
}
