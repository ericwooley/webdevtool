import React from 'react'
import clsx from 'clsx'
import { makeStyles } from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline'
import Drawer from '@material-ui/core/Drawer'
import Box from '@material-ui/core/Box'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import List from '@material-ui/core/List'
import Typography from '@material-ui/core/Typography'
import Divider from '@material-ui/core/Divider'
import IconButton from '@material-ui/core/IconButton'
import Container from '@material-ui/core/Container'
import Grid from '@material-ui/core/Grid'
import Link from '@material-ui/core/Link'
import MenuIcon from '@material-ui/icons/Menu'
import FavoriteIcon from '@material-ui/icons/Favorite'
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft'
import NavMenu from './navMenu'
import { ISection } from '../../interfaces'
import RadioButtonUncheckedSharpIcon from '@material-ui/icons/RadioButtonUncheckedSharp'
import AdjustSharpIcon from '@material-ui/icons/AdjustSharp'
import Section from './section'
import Switch from '@material-ui/core/Switch'
import CircularProgress from '@material-ui/core/CircularProgress'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import { socket } from '../'
import { COMMAND_TYPES } from '../../enums'

function Footer() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      Made with <FavoriteIcon color="error" fontSize="small" /> by&nbsp;
      <Link color="inherit" href="https://github.com/ericwooley/">
        Eric Wooley
      </Link>
    </Typography>
  )
}

const drawerWidth = 240

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex'
  },
  toolbar: {
    paddingRight: 24 // keep right padding when drawer closed
  },
  toolbarIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 8px',
    ...theme.mixins.toolbar
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    })
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  },
  menuButton: {
    marginRight: 36
  },
  menuButtonHidden: {
    display: 'none'
  },
  title: {
    flexGrow: 1
  },
  drawerPaper: {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  },
  drawerPaperClose: {
    overflowX: 'hidden',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    width: theme.spacing(7),
    [theme.breakpoints.up('sm')]: {
      width: theme.spacing(9)
    }
  },
  appBarSpacer: theme.mixins.toolbar,
  content: {
    flexGrow: 1,
    height: '100vh',
    overflow: 'auto'
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4)
  },
  paper: {
    padding: theme.spacing(2),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column'
  },
  fixedHeight: {
    height: 240
  }
}))

const Dashboard: React.FunctionComponent<{
  connected: boolean
  name: string
  sections: ISection[]
  darkMode: boolean
  toggleDarkMode: () => any
}> = props => {
  const confirmShutdown = React.useCallback(() => {
    if (confirm('Are you sure you want to kill the server?'))
      socket.sendMessage({
        sessionId: '',
        type: COMMAND_TYPES.SHUTDOWN,
        payload: {}
      })
  }, [])
  const classes = useStyles()
  const drawerKey = `${props.name}.drawerOpen`
  const [open, setOpen] = React.useState(
    JSON.parse(localStorage.getItem(drawerKey) || JSON.stringify(false))
  )
  const handleDrawerOpen = () => {
    localStorage.setItem(drawerKey, JSON.stringify(true))
    setOpen(true)
  }
  const handleDrawerClose = () => {
    localStorage.setItem(drawerKey, JSON.stringify(false))
    setOpen(false)
  }
  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar
        position="absolute"
        className={clsx(classes.appBar, open && classes.appBarShift)}
      >
        <Toolbar className={classes.toolbar}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            className={clsx(
              classes.menuButton,
              open && classes.menuButtonHidden
            )}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            component="h1"
            variant="h6"
            color="inherit"
            noWrap
            className={classes.title}
          >
            {props.name}
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={props.darkMode}
                onChange={props.toggleDarkMode}
                value="DarkMode"
              />
            }
            label="Dark Mode"
          />
          <IconButton onClick={props.connected ? confirmShutdown : undefined}>
            {props.connected ? (
              <AdjustSharpIcon
                style={{ color: 'white' }}
                titleAccess="connected"
              />
            ) : (
              <RadioButtonUncheckedSharpIcon
                color="error"
                titleAccess="disconnected"
              />
            )}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        classes={{
          paper: clsx(classes.drawerPaper, !open && classes.drawerPaperClose)
        }}
        open={open}
      >
        <div className={classes.toolbarIcon}>
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </div>
        <Divider />
        <List>
          <NavMenu sections={props.sections} />
        </List>
      </Drawer>
      <main className={classes.content}>
        <div className={classes.appBarSpacer} />
        <Container maxWidth={false} className={classes.container}>
          {props.connected ? (
            <Grid container spacing={1}>
              {props.sections.map(s => (
                <Section key={s.name} section={s} />
              ))}
            </Grid>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <CircularProgress size="5rem" />
              <br />
              <br />
              <Typography variant="body2" color="textSecondary" align="center">
                Waiting for socket connection
              </Typography>
            </div>
          )}
          <Box pt={4}>
            <Footer />
          </Box>
        </Container>
      </main>
    </div>
  )
}
export default Dashboard
