import { cp, mkdir, rm, readFile, writeFile, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join, relative } from 'node:path'
const root = 'harmony/entry/src/main/resources/rawfile/public'
await readFile('dist/index.html')
await rm(root, { recursive: true, force: true })
await mkdir(root, { recursive: true })
await cp('dist', root, { recursive: true })
const files = {}
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) await walk(path)
    else files[relative(root, path)] = createHash('sha256').update(await readFile(path)).digest('hex')
  }
}
await walk(root)
await writeFile('harmony/web-manifest.json', JSON.stringify({ version: JSON.parse(await readFile('package.json')).version, files }, null, 2) + '\n')
console.log(`Synced ${Object.keys(files).length} shared Web resources to HarmonyOS.`)
