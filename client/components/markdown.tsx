import React from 'react'
import ReactMarkdown from 'react-markdown'
import { createMuiTheme, ThemeProvider } from '@material-ui/core'
const theme = createMuiTheme({
  palette: {
    type: 'light'
  }
})
export default class Markdown extends React.PureComponent<{
  children: string
}> {
  render() {
    return <ReactMarkdown source={this.props.children} />
  }
}
