import React from 'react'
import Loadable from 'react-loadable'
import CircularProgress from '@material-ui/core/CircularProgress'

export default Loadable({
  loader: () => import('./terminalSection'),
  loading: () => <CircularProgress />
})
