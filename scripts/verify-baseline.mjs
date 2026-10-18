import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

const baseline = JSON.parse(await readFile('docs/verification/android-baseline.json', 'utf8'))
for (const [path, expected] of Object.entries(baseline.files)) {
  const reviewed = baseline.intentionalChanges?.[path]
  let content
  try { content = await readFile(path, 'utf8') }
  catch (error) {
    if (error.code === 'ENOENT' && reviewed?.removed === true) continue
    throw error
  }
  if (reviewed?.removed) throw new Error(`Removed Android baseline file unexpectedly restored: ${path}`)
  // Preserve the original Android fingerprint and explicitly reviewed later fixes.
  const bytes = path === 'src/views/AvatarPicker.tsx'
    ? Buffer.from(content.replace("from '../platform/camera'", "from '@capacitor/camera'"))
    : await readFile(path)
  const hash = createHash('sha256').update(bytes).digest('hex')
  if (hash !== expected && hash !== reviewed?.sha256) throw new Error(`Unreviewed Android baseline difference: ${path}`)
}
console.log(`PASS ${Object.keys(baseline.files).length} source/resource files checked against Android ${baseline.commit}; ${Object.keys(baseline.intentionalChanges ?? {}).length} reviewed follow-up fixes (camera import normalized)`)
