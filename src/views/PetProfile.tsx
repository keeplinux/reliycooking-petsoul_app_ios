import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Cake, Plus } from 'lucide-react'
import { useApp } from '../appContext'
import { TopBar } from '../components/TopBar'
import { sceneLoop } from '../sceneLoop'
import { createPetModel } from '../petModel'
import type { Pet } from '../nav'

/** 已录入宠物的档案页：标题为宠物名，展示 3D 形象回传模型与录入资料 */
export function PetProfileView({ petId }: { petId: string }) {
  const { navigate, pets, updatePet, removePet } = useApp()
  const pet = pets.find((item) => item.id === petId)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [name, setName] = useState(pet?.name ?? '')
  const [birthday, setBirthday] = useState(pet?.birthday ?? '')
  const [gender, setGender] = useState(pet?.gender ?? 'male')
  const [breed, setBreed] = useState(pet?.breed ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function save() {
    if (!pet || !name.trim()) { setError('请填写宠物名字'); return }
    setBusy(true); setError(null)
    try { await updatePet({ ...pet, name: name.trim(), birthday, gender, breed: breed.trim() || '待填写' }); setEditing(false) }
    catch { setError('保存失败，请释放存储空间后重试。') }
    finally { setBusy(false) }
  }
  async function confirmDelete() {
    setBusy(true); setError(null)
    try { await removePet(petId); navigate({ name: 'home' }) }
    catch { setError('删除未完成，请重试。'); setBusy(false) }
  }

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
          <p className="m-0 pb-3 text-[11px] text-[#171717]/40">示例 3D 形象 · 非真实重建</p>
        </section>

        {/* 录入资料 */}
        <section className="flex w-full max-w-sm flex-col self-center rounded-lg bg-[#171717]/3 p-4">
          <p className="m-0 flex items-center gap-2 text-sm font-medium">
            <Cake size={16} /> {pet.birthday || '生日未填写'}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[#171717]/55">
            <span>性别：{pet.gender === 'male' ? '弟弟 ♂' : '妹妹 ♀'}</span>
            <span>品种：{pet.breed} · 用户资料</span>
            <span>模型编号：{pet.id.slice(-6).toUpperCase()}</span>
            <span>花纹：{patternLabel[pet.model.pattern]}</span>
          </div>
        </section>

        {error && <p role="alert" className="self-center text-sm text-red-800">{error}</p>}
        <div className="grid w-full max-w-sm grid-cols-2 gap-3 self-center">
          <button className="min-h-11 rounded-xl border bg-white text-sm" onClick={() => setEditing(true)}>编辑资料</button>
          <button className="min-h-11 rounded-xl border bg-white text-sm" onClick={() => navigate({ name: 'petCapture', petId })}>重新采集形象</button>
        </div>
        <button className="min-h-11 self-center px-4 text-sm text-red-800" onClick={() => setDeleting(true)}>删除宠物档案</button>
        <button
          type="button"
          onClick={() => navigate({ name: 'petCapture' })}
          className="flex h-11 w-full max-w-sm items-center justify-center gap-2 self-center rounded-lg bg-[#171717] text-sm font-medium text-white hover:bg-[#171717]/85"
        >
          <Plus size={16} /> 添加新宠物
        </button>
      </main>
      {editing && <div className="fixed inset-0 z-50 flex items-end bg-black/50">
        <section role="dialog" aria-modal="true" aria-label="编辑宠物资料" className="max-h-[85%] w-full overflow-y-auto rounded-t-3xl bg-white p-5 safe-bottom">
          <h2 className="text-lg">编辑宠物资料</h2>
          <label className="mb-3 block text-sm">宠物名字<input className="mt-1 min-h-11 w-full rounded-xl border p-3" value={name} maxLength={12} onChange={(e) => setName(e.target.value)} /></label>
          <label className="mb-3 block text-sm">生日<input className="mt-1 block min-h-11 w-full appearance-none rounded-xl border p-3" type="date" max={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`} value={birthday} onChange={(e) => setBirthday(e.target.value)} /></label>
          <label className="mb-3 block text-sm">性别<select className="mt-1 min-h-11 w-full rounded-xl border p-3" value={gender} onChange={(e) => setGender(e.target.value as 'male' | 'female')}><option value="male">弟弟</option><option value="female">妹妹</option></select></label>
          <label className="mb-3 block text-sm">品种（可选）<input className="mt-1 min-h-11 w-full rounded-xl border p-3" maxLength={30} value={breed} onChange={(e) => setBreed(e.target.value)} /></label>
          {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
          <button disabled={busy} onClick={() => { void save() }} className="min-h-12 w-full rounded-xl bg-[#193e32] text-white">{busy ? '保存中…' : '保存资料'}</button>
          <button disabled={busy} onClick={() => { setEditing(false); setName(pet.name); setBirthday(pet.birthday); setGender(pet.gender); setBreed(pet.breed); setError(null) }} className="mt-2 min-h-11 w-full">取消</button>
        </section>
      </div>}
      {deleting && <div className="fixed inset-0 z-50 flex items-end bg-black/50"><section role="dialog" aria-modal="true" aria-label="删除宠物档案" className="w-full rounded-t-3xl bg-white p-5 safe-bottom"><h2 className="text-lg">删除「{pet.name}」？</h2><p className="text-sm leading-6 text-[#555]">将移除此账号中的本机宠物档案，无法在应用内恢复。不会解绑设备，也不会影响其他宠物。</p>{error && <p role="alert">{error}</p>}<button disabled={busy} onClick={() => { void confirmDelete() }} className="min-h-12 w-full rounded-xl bg-red-800 text-white">确认删除档案</button><button disabled={busy} onClick={() => setDeleting(false)} className="mt-2 min-h-11 w-full">保留档案</button></section></div>}
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

    const stopLoop = sceneLoop((_time, reduced) => {
      if (!reduced) group.rotation.y += 0.008
      renderer.render(scene, camera)
    })

    return () => {
      stopLoop()
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
