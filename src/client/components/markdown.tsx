import React from 'react'
import ReactMarkdown from 'react-markdown'
import styled from 'styled-components'
const Wrapper = styled.div`
  color: black;
  background: rgba(255, 255, 255, 0.75);
  border-radius: 3px;
  margin: 3px;
  padding: 5px;
`

export default class Markdown extends React.PureComponent<{
  children: string
}> {
  render() {
    return (
      <Wrapper>
        <ReactMarkdown source={this.props.children} />
      </Wrapper>
    )
  }
}
