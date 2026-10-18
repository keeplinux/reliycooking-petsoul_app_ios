import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Cake, Plus } from 'lucide-react'
import { useApp } from '../appContext'
import { TopBar } from '../components/TopBar'
import { createPetModel } from '../petModel'
import type { Pet } from '../nav'

/** 已录入宠物的档案页：标题为宠物名，展示 3D 形象回传模型与录入资料 */
export function PetProfileView({ petId }: { petId: string }) {
  const { navigate, pets } = useApp()
  const pet = pets.find((item) => item.id === petId)

  if (!pet) {
    return (
      <>
        <TopBar title="宠物档案" onBack={() => navigate({ name: 'home' })} />
        <main className="flex flex-1 items-center justify-center p-4">
          <p className="m-0 text-sm text-[#171717]/45">宠物不存在或已删除</p>
        </main>
      </>
    )
  }

  return (
    <>
      <TopBar title={pet.name} onBack={() => navigate({ name: 'home' })} />
      <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 safe-bottom">
        {/* 服务器回传的 3D 形象（模型生成成功后不再回显采集的四视图/视频） */}
        <section className="flex aspect-square w-full max-w-sm flex-col items-center justify-center overflow-hidden self-center rounded-lg border border-[#171717]/10 bg-white">
          <PetModelStage pet={pet} />
          <p className="m-0 pb-3 text-[11px] text-[#171717]/40">服务器构建的 3D 形象 · 自动旋转</p>
        </section>

        {/* 录入资料 */}
        <section className="flex w-full max-w-sm flex-col self-center rounded-lg bg-[#171717]/3 p-4">
          <p className="m-0 flex items-center gap-2 text-sm font-medium">
            <Cake size={16} /> {pet.birthday || '生日未填写'}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[#171717]/55">
            <span>性别：{pet.gender === 'male' ? '弟弟 ♂' : '妹妹 ♀'}</span>
            <span>品种：{pet.breed} · 云识别</span>
            <span>模型编号：{pet.id.slice(-6).toUpperCase()}</span>
            <span>花纹：{patternLabel[pet.model.pattern]}</span>
          </div>
        </section>

        <button
          type="button"
          onClick={() => navigate({ name: 'petCapture' })}
          className="flex h-11 w-full max-w-sm items-center justify-center gap-2 self-center rounded-lg bg-[#171717] text-sm font-medium text-white hover:bg-[#171717]/85"
        >
          <Plus size={16} /> 添加新宠物
        </button>
      </main>
    </>
  )
}

const patternLabel = {
  solid: '纯色',
  socks: '白袜子',
  patch: '补丁',
} as const

/** 独立的迷你 3D 展示台：自动缓慢旋转展示宠物模型 */
function PetModelStage({ pet }: { pet: Pet }) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 20)
    camera.position.set(0, 1.1, 2.6)
    camera.lookAt(0, 0.45, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    mount.appendChild(renderer.domElement)

    scene.add(new THREE.HemisphereLight(0xffffff, 0xbcc7d1, 1.5))
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6)
    keyLight.position.set(2, 3, 2)
    scene.add(keyLight)

    const { group } = createPetModel(pet.model)
    scene.add(group)

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(0.9, 32),
      new THREE.MeshStandardMaterial({ color: 0x171717, transparent: true, opacity: 0.06 }),
    )
    ground.rotation.x = -Math.PI / 2
    scene.add(ground)

    let raf = 0
    const resize = () => {
      const width = mount.clientWidth
      const height = mount.clientHeight
      if (!width || !height) return
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(mount)

    const tick = () => {
      group.rotation.y += 0.008
      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          const material = object.material
          if (Array.isArray(material)) {
            material.forEach((item) => item.dispose())
          } else {
            material.dispose()
          }
        }
      })
      renderer.dispose()
      observer.disconnect()
      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [pet])

  return <div ref={mountRef} className="h-64 w-64" />
}
