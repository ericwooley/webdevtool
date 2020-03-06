import express, { Request } from 'express'
import yargs from 'yargs'
import { readFileSync, promises as fs } from 'fs'
import { join } from 'path'
import { parse } from 'yaml'
import portastic from 'portastic'
import cors from 'cors'
import { runCommandOverWebsocket } from './socket'
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
  .describe('wsPortMin', 'minimum port number for websocket connections')
  .default('wsPortMin', 4307)
  .describe('wsPortMax', 'maximum port number for websocket connections')
  .default('wsPortMax', 4406)
  .alias('d', 'dev')
  .default('d', process.env.DEV_SERVER || '')
  .describe('d', 'proxy frontend requests to process.env.DEV_SERVER')
  .help('h')
  .alias('h', 'help')
  .epilog('created by github.com/ericwooley').argv

const terminals: { [key: string]: { stop: () => Promise<any> } } = {}
try {
  const devFile = parse(readFileSync(join(process.cwd(), args.f)).toString())
  const app = express()
  app.use(
    '*',
    cors({
      origin: '*'
    })
  )

  app.get('/config', async (req, res) => res.json(devFile))
  app.get('/run-command/:idx', async (req: Request<{ idx: string }>, res) => {
    const ports = await portastic.find({
      min: args.wsPortMin,
      max: args.wsPortMax
    })
    const terminal = devFile.terminals[req.params.idx]
    if (!terminal) {
      res.json({ error: 'could not find terminal: ' + req.params.idx })
      res.statusCode = 404
      return
    }
    res.json({ terminal, port: ports[0] })
    terminals[req.params.idx] = await runCommandOverWebsocket(
      terminal,
      ports[0]
    )
  })
  app.listen(args.p, () => console.log('listening on', args.p))
} catch (e) {
  console.error('Server error', e)
  process.exitCode = 1
}
