/**
 * 原型运行配置
 *
 * 当前尚未接入设备侧能力（BLE 传输层、相机二维码解码、设备 AP 探测），
 * 因此这几项由本地模拟替代。模拟逻辑全部收敛在这个开关后面，
 * 接入真机时把开关关掉即可，页面与状态机无需改动。
 */
export const simulateHardware = true

/** 模拟识别的耗时（毫秒），仅用于让流程有可感知的节奏 */
export const scanRecognizeMs = 1200
export const hotspotProbeMs = 1500
