import React from 'react'
import ComputerIcon from '@material-ui/icons/Computer'
import BookmarksIcon from '@material-ui/icons/Bookmarks'
import LiveHelpIcon from '@material-ui/icons/LiveHelp'
import { SvgIconProps } from '@material-ui/core'

const typeToIcon = (type: string) => {
  switch (type) {
    case 'url':
      return BookmarksIcon
    case 'terminal':
      return ComputerIcon
    default:
      return LiveHelpIcon
  }
}
export default class TypeIcon extends React.PureComponent<
  {
    type: string
  } & SvgIconProps
> {
  render() {
    const { type, ...restProps } = this.props
    const Icon = typeToIcon(type)
    return <Icon {...restProps} />
  }
}
