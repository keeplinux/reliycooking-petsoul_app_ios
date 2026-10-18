export type View =
  | { name: 'splash' }
  | { name: 'home' }
  | { name: 'mall' }
  | { name: 'purchase'; productId: string }
  | { name: 'scan'; expectProductId?: string }
  | { name: 'hotspot' }
  | { name: 'provision'; payload: QrPayload; source: ProvisionSource }
  | { name: 'settings' }
  | { name: 'avatarPicker' }
  | { name: 'device'; deviceId: string }
  | { name: 'petCapture' }
  | { name: 'petProfile'; petId: string }

export type AccountMethod = 'phone' | 'wechat'

export type Account = {
  id: string
  method: AccountMethod
  identifier: string
  /** 用户资料头像（预设形象 id），见 src/avatars.ts */
  avatarId?: string
  /** 用户自定义头像（本地相册/相机，压缩后的方形 dataURL），优先于 avatarId */
  avatarImage?: string
}

export type DeviceKind = 'water' | 'feeder' | 'litter' | 'camera' | 'tracker' | 'generic'

/** 设备绑定来源：scan 扫码配网；hotspot 保底热点配网 */
export type ProvisionSource = 'scan' | 'hotspot'

/**
 * unbound：星球上预置的未绑定设备（占位），首次扫码同型号产品即绑定这台设备
 * bound：已完成配网并绑定
 * pending：通过保底热点发现，等待用户手动配网
 */
export type DeviceStatus = 'unbound' | 'bound' | 'pending'

export type Device = {
  id: string
  kind: DeviceKind
  productId: string
  name: string
  online: boolean
  /** 设备序列号，绑定的唯一键 */
  sn: string
  /** 设备 BLE MAC，用于在扫描结果中精确定位这一台 */
  mac: string
  /** 配网成功后设备接入的 WiFi 名称 */
  wifiSsid: string | null
  source: ProvisionSource
  status: DeviceStatus
  /** 绑定时间戳 */
  boundAt: number
}

/** 新增 / 更新设备的输入，按 sn 去重 */
export type DeviceInput = {
  productId: string
  sn: string
  mac: string
  wifiSsid: string | null
  status: DeviceStatus
  source: ProvisionSource
}

/** 产品机身二维码中携带的设备信息 */
export type QrPayload = {
  productId: string
  sn: string
  mac: string
  /** 设备绑定令牌，同时用于 BLE 会话与热点会话的设备鉴权 */
  token: string
}

/** 产品型号/配色变体（商城卡片内横向滑动浏览） */
export type ProductVariant = {
  /** 型号（如 标准版 / 大容量版） */
  model: string
  /** 配色名（宇宙叙事命名，如 星舰白 / 星云紫） */
  color: string
  /** 展示氛围底色 */
  bg: string
}

export type Product = {
  id: string
  name: string
  category: string
  description: string
  image: string
  variants: ProductVariant[]
}

export type PetGender = 'male' | 'female'

/** 服务器构建回传的宠物模型参数（demo 阶段为假回传，本地生成） */
export type PetModelSeed = {
  /** 主体色（#rrggbb） */
  color: string
  /** 体型系数 0.85 - 1.25 */
  scale: number
  /** 花纹：纯色 / 白袜子 / 补丁 */
  pattern: 'solid' | 'socks' | 'patch'
}

/** 录入媒体：四视图照片（正/左/右/背，dataURL 持久化）或环绕视频（会话内 blobURL） */
export type PetMedia =
  | { kind: 'photos'; front: string; left: string; right: string; back: string }
  | { kind: 'video'; url: string }

export type Pet = {
  id: string
  name: string
  /** 生日 YYYY-MM-DD */
  birthday: string
  gender: PetGender
  /** 品种：云服务器按录入媒体自动识别回传（demo 阶段为模拟识别） */
  breed: string
  /** 录入的照片/视频（确保全面收集宠物外表信息） */
  media: PetMedia | null
  /** 模型构建参数（上传后服务器回传） */
  model: PetModelSeed
}
