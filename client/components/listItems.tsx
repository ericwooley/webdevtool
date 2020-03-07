import React from 'react'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import ComputerIcon from '@material-ui/icons/Computer'
import BookmarksIcon from '@material-ui/icons/Bookmarks'
import { IShortcut, ITerminal } from '../interfaces'
import styled from 'styled-components'
const Initials = styled.span`
  display: inline-block;
  text-overflow: ellipsis;
  width: 1.5rem;
  margin-top: 1rem;
  margin-left: .4rem;
  font-size: 0.6rem;
  position: absolute;
  color: white;
  font-weight: bold;
`
const getInitials = (str: string) =>
  str
    .split(/\W/g)
    .map(s => s.charAt(0) || '')
    .join('')
    .toUpperCase()

export const MainListItems: React.FunctionComponent<{
  terminals: ITerminal[]
}> = () => (
  <div>
    <ListItem button>
      <ListItemIcon>
        <ComputerIcon fontSize="large" />
      </ListItemIcon>
      <ListItemText primary="Dashboard" />
    </ListItem>
  </div>
)

export const SecondaryListItems: React.FunctionComponent<{
  shortCuts: IShortcut[]
}> = props => (
  <div>
    {props.shortCuts.map(shortcut => (
      <ListItem button key={JSON.stringify(shortcut)}>
        <ListItemIcon>
          <>
            <Initials>{getInitials(shortcut.name)}</Initials>
            <BookmarksIcon fontSize="large" titleAccess={shortcut.name}></BookmarksIcon>
          </>
        </ListItemIcon>
        <ListItemText primary={shortcut.name} />
      </ListItem>
    ))}
  </div>
)
