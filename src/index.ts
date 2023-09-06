import { cac } from "https://unpkg.com/cac@6.7.14/mod.ts"
import { login } from './config.ts'
import { newRebyteJson, deploy } from './rebyte.ts'
import { version } from './version.ts'

const cli = cac('rebyte')

cli.command('login', 'Login rebyte use your api key')
  .option('-k, --api-key <api-key>', "Your rebyte api key")
  .action(async (options) => {
    const key = options.apiKey
    await login(key)
  })

cli.command('deploy <dir>', 'deploy your main file to rebyte')
  .action(async (dir) => {
    const rebyte = await newRebyteJson(dir)
    await deploy(dir, rebyte)
  })

cli.version(version)
cli.help()
cli.parse()

