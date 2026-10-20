import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
const candidates = [process.env.DEVECO_HOME, '/Applications/DevEco-Studio.app/Contents', '/Applications/DevEco Studio.app/Contents'].filter(Boolean)
const home = candidates.find(path => existsSync(join(path, 'tools/hvigor/bin/hvigorw.js')))
const runner = process.env.HVIGORW_JS || (home && join(home, 'tools/hvigor/bin/hvigorw.js'))
if (!runner || !existsSync(runner)) {
  console.error('缺少 DevEco Studio/Hvigor，无法编译 HAP。请从华为官网下载并首次启动完成 SDK 安装，设置 DEVECO_HOME 或 HVIGORW_JS；源码目录为 harmony/。这不是已生成的手机安装包。')
  process.exit(2)
}
const node = home && existsSync(join(home, 'tools/node/bin/node')) ? join(home, 'tools/node/bin/node') : process.execPath
const result = spawnSync(node, [runner, '--mode', 'module', '-p', 'product=default', '-p', 'module=entry@default', '-p', 'buildMode=debug', 'assembleHap', '--no-daemon'], { cwd: 'harmony', stdio: 'inherit', env: process.env })
process.exit(result.status ?? 1)
