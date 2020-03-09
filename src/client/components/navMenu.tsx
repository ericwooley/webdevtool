import React from 'react'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import { ISection } from '../../interfaces'
import styled from 'styled-components'
import getInitials from '../utils/getInitials'
import TypeIcon from './typeIcon'
const Initials = styled.span`
  display: inline-block;
  text-overflow: ellipsis;
  width: 1.5rem;
  margin-top: 0.7rem;
  margin-left: 0.4rem;
  font-size: 0.6rem;
  position: absolute;
  color: black;
  font-weight: bold;
`

const NavMenu: React.FunctionComponent<{
  sections: ISection[]
  depth?: number
}> = props => {
  const { depth = 0 } = props
  return (
    <div>
      {props.sections.map(section => {
        return (
          <React.Fragment key={section.name + depth}>
            <ListItem button>
              <ListItemIcon>
                <>
                  <Initials>{getInitials(section.name)}</Initials>
                  <TypeIcon
                    type={section.type}
                    fontSize="large"
                    titleAccess={section.name}
                  />
                </>
              </ListItemIcon>
              <ListItemText primary={section.name} />
            </ListItem>
            {section.sections && (
              <div style={{ borderLeft: '3px solid #333', marginLeft: 3 }}>
                <NavMenu sections={section.sections} depth={depth + 1} />
              </div>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
export default NavMenu
