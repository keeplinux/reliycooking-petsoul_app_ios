import * as THREE from 'three'
import type { PetModelSeed } from './nav'

/**
 * 宠物 3D 模型构建（猫体素风）。
 * 首页星球与宠物档案页共用；正式版由服务器按录入照片构建并下发模型，
 * demo 阶段用 seed 参数本地生成假回传模型。
 */
export function createPetModel(seed: PetModelSeed): { group: THREE.Group; head: THREE.Mesh } {
  const group = new THREE.Group()
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: seed.color })
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x171717 })
  const whiteMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5f5 })

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 16), bodyMaterial)
  body.scale.set(1.15, 0.85, 1.25)
  body.position.y = 0.3
  group.add(body)

  // 花纹：白袜子 = 四肢白；补丁 = 背上一块白
  if (seed.pattern === 'socks') {
    for (const [x, z] of [
      [0.13, 0.16],
      [-0.13, 0.16],
      [0.13, -0.16],
      [-0.13, -0.16],
    ] as const) {
      const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.14, 10), whiteMaterial)
      sock.position.set(x, 0.13, z)
      group.add(sock)
    }
  }
  if (seed.pattern === 'patch') {
    const patch = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), whiteMaterial)
    patch.scale.set(1.6, 0.6, 1)
    patch.position.set(0.06, 0.42, -0.08)
    group.add(patch)
  }

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 16), bodyMaterial)
  head.position.set(0, 0.54, 0.2)
  group.add(head)

  const earGeometry = new THREE.ConeGeometry(0.07, 0.12, 4)
  const earLeft = new THREE.Mesh(earGeometry, bodyMaterial)
  earLeft.position.set(-0.1, 0.68, 0.18)
  earLeft.rotation.z = -0.25
  const earRight = earLeft.clone()
  earRight.position.x = 0.1
  earRight.rotation.z = 0.25
  group.add(earLeft, earRight)

  const eyeGeometry = new THREE.SphereGeometry(0.028, 10, 8)
  const eyeLeft = new THREE.Mesh(eyeGeometry, darkMaterial)
  eyeLeft.position.set(-0.07, 0.56, 0.34)
  const eyeRight = eyeLeft.clone()
  eyeRight.position.x = 0.07
  group.add(eyeLeft, eyeRight)

  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.38, 8), bodyMaterial)
  tail.position.set(-0.2, 0.4, -0.2)
  tail.rotation.x = 1.1
  tail.rotation.z = 0.4
  group.add(tail)

  group.scale.setScalar(seed.scale)
  return { group, head }
}

/** 未录入宠物时的默认模型 seed（首页占位猫） */
export const DEFAULT_PET_SEED: PetModelSeed = {
  color: '#e08a4e',
  scale: 1,
  pattern: 'solid',
}

/** 模拟云服务器品种识别：按录入信息稳定"识别"一个常见品种（demo 假回传，正式版由云端按照片/视频识别） */
export function recognizePetBreed(input: { name: string; birthday: string }): string {
  const breeds = ['中华田园猫', '英国短毛猫', '美国短毛猫', '布偶猫', '暹罗猫', '缅因猫', '橘猫', '三花猫']
  let hash = 0
  const text = `${input.name}|${input.birthday}`
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0
  }
  return breeds[hash % breeds.length]
}

/** 模拟服务器构建回传：按录入信息本地生成假模型参数 */
export function buildPetModelSeed(input: { name: string; birthday: string }): PetModelSeed {
  const palette = ['#e08a4e', '#7f9cf5', '#b47ad4', '#5bb5a0', '#8a8a8a', '#d9c89a']
  const patterns: PetModelSeed['pattern'][] = ['solid', 'socks', 'patch']
  let hash = 0
  const text = `${input.name}|${input.birthday}`
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0
  }
  return {
    color: palette[hash % palette.length],
    scale: 0.85 + ((hash >>> 8) % 41) / 100,
    pattern: patterns[hash % patterns.length],
  }
}
