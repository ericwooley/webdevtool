import express from 'express'
import yargs from 'yargs'
import { readFileSync, promises as fs } from 'fs'
import { join } from 'path'
import { parse } from 'yaml'
import cors from 'cors'
import { startWebsocketServer } from './socket'
import { IConfig, IAutoId } from '../interfaces'
import { createHash, randomBytes } from 'crypto'
import generateSectionIds from './generateSectionIds'
import replaceFilesWithContents from './replaceFilesWIthContents'
const generateAutoId = (algorithm: string) => {
  return <T extends IAutoId>(e: T): T => {
    const hasher = createHash(algorithm, {})
    const id = e.id || hasher.update(e.name).digest('hex')
    return { ...e, id }
  }
}
const args = yargs
  .usage('Usage: $0 <command> [options]')
  .command('start', 'start serving a development service')
  .example('$0 start', 'start the devtool using devtool.yaml')
  .example(
    '$0 start -f devtool.integration-tests.yaml',
    'start the devtool with a custom file'
  )
  .alias('f', 'file')
  .nargs('f', 1)
  .default('f', 'devtool.yaml')
  .describe('f', 'Load a devtool file')
  .alias('p', 'port')
  .default('p', 4306)
  .describe('p', 'Port for serving the frontend')
  .describe('wsPort', 'Port for websocket connections')
  .default('wsPort', 4307)
  .alias('d', 'dev')
  .default('d', process.env.DEV_SERVER || '')
  .describe('d', 'proxy frontend requests to process.env.DEV_SERVER')
  .help('h')
  .alias('h', 'help')
  .epilog('created by github.com/ericwooley').argv
const devFilePath = join(process.cwd(), args.f)
try {
  const devFile: IConfig = parse(readFileSync(devFilePath).toString())
  devFile.wsPort = args.wsPort || devFile.wsPort
  devFile.sections = generateSectionIds(devFile.sections)
  devFile.sections = replaceFilesWithContents(devFile.sections, devFilePath)
  const app = express()
  app.use(
    '*',
    cors({
      origin: '*'
    })
  )

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
  app.listen(args.p, () => console.log('listening on', args.p))
  startWebsocketServer(devFile, args.wsPort)
} catch (e) {
  console.error('Server error', e)
  process.exitCode = 1
}
