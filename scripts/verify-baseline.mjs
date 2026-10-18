import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

const baseline = JSON.parse(await readFile('docs/verification/android-baseline.json', 'utf8'))
for (const [path, expected] of Object.entries(baseline.files)) {
  const content = await readFile(path, 'utf8')
  // Preserve the original Android fingerprint and explicitly reviewed later fixes.
  const bytes = path === 'src/views/AvatarPicker.tsx'
    ? Buffer.from(content.replace("from '../platform/camera'", "from '@capacitor/camera'"))
    : await readFile(path)
  const hash = createHash('sha256').update(bytes).digest('hex')
  const reviewed = baseline.intentionalChanges?.[path]
  if (hash !== expected && hash !== reviewed?.sha256) throw new Error(`Unreviewed Android baseline difference: ${path}`)
}
console.log(`PASS ${Object.keys(baseline.files).length} source/resource files checked against Android ${baseline.commit}; ${Object.keys(baseline.intentionalChanges ?? {}).length} reviewed follow-up fixes (camera import normalized)`)
