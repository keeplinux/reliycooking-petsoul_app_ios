import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

const baseline = JSON.parse(await readFile('docs/verification/android-baseline.json', 'utf8'))
for (const [path, expected] of Object.entries(baseline.files)) {
  let content = await readFile(path, 'utf8')
  // The only intentional change to an imported UI file is the camera boundary.
  const bytes = path === 'src/views/AvatarPicker.tsx'
    ? Buffer.from(content.replace("from '../platform/camera'", "from '@capacitor/camera'"))
    : await readFile(path)
  const hash = createHash('sha256').update(bytes).digest('hex')
  if (hash !== expected) throw new Error(`Android baseline differs: ${path}`)
}
console.log(`PASS ${Object.keys(baseline.files).length} source/resource files match Android ${baseline.commit} (camera import normalized)`)
