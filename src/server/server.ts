#! /usr/bin/env node

import express from 'express'
import yargs from 'yargs'
import {
  readFileSync,
  promises as fs,
  writeFileSync,
  writeFile,
  unlinkSync
} from 'fs'
import { join } from 'path'
import { parse } from 'yaml'
import cors from 'cors'
import { startWebsocketServer } from './socket'
import { IConfig } from '../interfaces'
import { randomBytes } from 'crypto'
import generateSectionIds from './generateSectionIds'
import replaceFilesWithContents from './replaceFilesWIthContents'
import { fork } from 'child_process'
import WebSocket from 'ws'
import { COMMAND_TYPES } from '../enums'

const lockFile = join(process.cwd(), 'webdevtool.lock')
const getLockInfo = (): ILockInfo =>
  JSON.parse(readFileSync(lockFile).toString())

const saveLockInfo = (settings: ILockInfo) =>
  writeFileSync(lockFile, JSON.stringify(settings, null, 2))
const argsFromYarn = yargs
  .usage('Usage: $0 <command> [options]')
  .example('$0 start', 'start the webdevtool using webdevtool.yaml')
  .example(
    '$0 start -f webdevtool.integration-tests.yaml',
    'start the webdevtool with a custom file'
  )
  .alias('f', 'file')
  .nargs('f', 1)
  .default('f', 'webdevtool.yaml')
  .describe('f', 'Load a webdevtool file')
  .alias('p', 'port')
  .default('p', 4306)
  .describe('p', 'Port for serving the frontend')
  .describe('wsPort', 'Port for websocket connections')
  .default('wsPort', 4307)
  .alias('d', 'dev')
  .alias('s', 'startForeground')
  .describe('s', 'Start server in foreground')
  .default('s', false)
  .default('d', process.env.DEV_SERVER || '')
  .describe('d', 'proxy frontend requests to process.env.DEV_SERVER')
  .help('h')
  .alias('h', 'help')
  .epilog('created by github.com/ericwooley')
  .command(
    'kill',
    'kill running daemon',
    () => {},
    args => {
      try {
        const { pid, wsPort } = getLockInfo()
        console.error('kill daemon on pid:', pid.toString())
        const client = new WebSocket(`ws://localhost:${wsPort}`)
        client.on('open', () => {
          console.log('opened')
          client.send({
            type: COMMAND_TYPES.SHUTDOWN
          })
        })
        unlinkSync(lockFile)
        process.exit()
      } catch (e) {
        console.error(
          'could not kill webdevtool for project:',
          process.cwd(),
          e.message
        )
      }
    }
  )
  .command(
    'start',
    'start serving a development daemon',
    () => {},
    args => {
      try {
        const pid = readFileSync(lockFile)
        console.error('Already running, pid:', pid.toString())
        process.exit()
      } catch (e) {
        const argsForChild = [__filename, ...process.argv.slice(3), 'server']
        const runtime =
          process.env.NODE_ENV === 'development'
            ? require.resolve('ts-node')
            : 'node'
        console.log('starting server with options: ', runtime, argsForChild)
        const child = fork(runtime, argsForChild)
        saveLockInfo({ pid: child.pid, ...args })

        child.on('exit', code => process.exit(code || 0))

        setTimeout(() => {
          console.log('exiting')
          process.exit()
        }, 3000)
      }
    }
  )
  .command(
    'server',
    'Start server in foreground',
    () => {},
    args => {
      console.log({ args })
      const devFilePath = join(process.cwd(), args.f)
      try {
        const devFile: IConfig = parse(readFileSync(devFilePath).toString())
        devFile.wsPort = args.wsPort || devFile.wsPort
        devFile.sections = generateSectionIds(devFile.sections)
        devFile.sections = replaceFilesWithContents(
          devFile.sections,
          devFilePath
        )
        const app = express()
        app.use(
          '*',
          cors({
            origin: '*'
          })
        )
        app.use(express.static(join(__dirname, 'public')))
        if (process.env.NODE_ENV === 'development') {
          app.get('/', (req, res) => {
            res.redirect('http://localhost:1234')
          })
        }
        app.get('/config', async (req, res) => res.json(devFile))
        app.get('/generateSessionId', async (req, res) => {
          randomBytes(48, function(err, buffer) {
            if (err) {
              res.json({ error: err })
              res.statusCode = 500
              return
            }
            res.json(buffer.toString('hex'))
          })
        })
        app.listen(args.p, () =>
          console.log(`listening on http://localhost:${args.p}`)
        )
        app.on('close', () => {
          console.log('exit from express')
          process.exit()
        })
        startWebsocketServer(devFile, args.wsPort)
      } catch (e) {
        console.error('Server error', e)

        process.exit(1)
      }
    }
  ).argv
type Args = typeof argsFromYarn
interface ILockInfo extends Args {
  pid: number
}
