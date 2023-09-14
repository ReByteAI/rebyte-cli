import { cac } from "https://unpkg.com/cac@6.7.14/mod.ts"
import { login } from './config.ts'
import { newRebyteJson, deploy } from './rebyte.ts'
import { version } from './version.ts'

const cli = cac('rebyte')

cli.command('login', 'Login rebyte use your api key')
  .option('-k, --api-key <api-key>', "Your rebyte api key")
  .option('-u, --url <server-url>', "Your rebyte server url, default is: https://rebyte.ai", {
    default: "https://rebyte.ai"
  })
  .action(async (options) => {
    const key = options.apiKey
    const url = options.url
    const success = await login(key, url)
    if (success) {
      console.log("Login successfully")
    } else {
      console.log("Login failed, api key is invalidate")
    }
  })

cli.command('deploy <dir>', 'deploy your main file to rebyte')
  .action(async (dir) => {
    const rebyte = await newRebyteJson(dir)
    await deploy(dir, rebyte)
  })

cli.version(version)
cli.parse()
cli.outputHelp()
