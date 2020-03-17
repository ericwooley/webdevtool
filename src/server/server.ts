#! /usr/bin/env node

import express from 'express'
import yargs from 'yargs'
import { readFileSync, promises as fs, writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { parse } from 'yaml'
import cors from 'cors'
import { startWebsocketServer } from './socket'
import { IConfig } from '../interfaces'
import { randomBytes } from 'crypto'
import generateSectionIds from './generateSectionIds'
import replaceFilesWithContents from './replaceFilesWIthContents'
import { spawn } from 'child_process'
import WebSocket from 'ws'
import { COMMAND_TYPES } from '../enums'
import { createServer } from 'http'

const lockFile = (filename: string) => join(process.cwd(), `${filename}.lock`)
const getLockInfo = (fileName: string): ILockInfo =>
  JSON.parse(readFileSync(lockFile(fileName)).toString())

const saveLockInfo = (settings: ILockInfo, fileName: string) =>
  writeFileSync(lockFile(fileName), JSON.stringify(settings, null, 2))
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
    '$0',
    'warn about commands',
    () => {},
    argv => {
      console.log('no command given, see --help')
      process.exit(1)
    }
  )
  .command(
    'kill',
    'kill running daemon',
    () => {},
    args => {
      try {
        const { pid, port } = getLockInfo(args.f)
        console.error('kill daemon on pid:', pid.toString())
        const client = new WebSocket(`ws://localhost:${port}`)
        client.on('open', () => {
          console.log('sending kill signal')
          client.send(
            JSON.stringify({
              type: COMMAND_TYPES.SHUTDOWN
            })
          )
          process.exit()
        })
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
        const pid = readFileSync(lockFile(args.f))
        console.error('Already running, pid:', pid.toString())
        process.exit()
      } catch (e) {
        const argsForChild = [__filename, ...process.argv.slice(3), 'server']
        const runtime =
          process.env.NODE_ENV === 'development' ? 'ts-node' : 'node'
        console.log('starting server with options: ', runtime, argsForChild)
        const child = spawn(runtime, argsForChild)

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
      saveLockInfo({ pid: process.pid, ...args }, args.f)
      process.on('exit', () => unlinkSync(lockFile(args.f)))
      const devFilePath = join(process.cwd(), args.f)
      try {
        const devFile: IConfig = parse(readFileSync(devFilePath).toString())
        devFile.port = args.p
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
        const server = createServer(app)

        startWebsocketServer(devFile, server)

        server.listen(args.p, () =>
          console.log(`listening on http://localhost:${args.p}`)
        )
        app.on('close', () => {
          console.log('exit from express')
          process.exit()
        })
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
