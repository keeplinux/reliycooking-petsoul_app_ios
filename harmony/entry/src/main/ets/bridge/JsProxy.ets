import { common } from '@kit.AbilityKit';
import { Request, Reply, Emit, SelectDevice, BleParams, PhotoParams, NavigationParams, APP_ORIGIN } from './Contract';
import { BleBridge } from './BleBridge';
import { MediaBridge } from './MediaBridge';

export class JsProxy {
  canGoBack: boolean = false;
  private ble: BleBridge;
  readonly media: MediaBridge;
  private active: boolean = true;
  private requests: Set<number> = new Set<number>();
  private mediaBusy: boolean = false;
  private emit: Emit;
  private url: () => string;
  constructor(context: common.UIAbilityContext, emit: Emit, select: SelectDevice, url: () => string) {
    this.emit = emit; this.url = url;
    this.ble = new BleBridge(context, emit, select); this.media = new MediaBridge(context);
  }
  invoke(raw: string): string {
    if (!this.active || this.url() !== APP_ORIGIN + '/index.html' || raw.length > 65536 || this.requests.size >= 16) return 'rejected';
    try {
      const request = JSON.parse(raw) as Request;
      const allowed = ['navigation.state', 'camera.photo', 'scanner.scan', 'ble.initialize', 'ble.isEnabled', 'ble.requestDevice', 'ble.connect', 'ble.disconnect', 'ble.read', 'ble.write', 'ble.notify', 'ble.readRssi'];
      if (!Number.isSafeInteger(request.id) || request.id < 1 || this.requests.has(request.id) || typeof request.params !== 'string' || !allowed.includes(request.method)) return 'rejected';
      this.requests.add(request.id);
      this.dispatch(request).then((result: string) => this.respond({ id: request.id, result: result }))
        .catch((error: Error) => this.respond({ id: request.id, error: error.message || '原生能力调用失败' }));
      return 'accepted';
    } catch (_) { return 'rejected'; }
  }
  private respond(reply: Reply): void {
    if (reply.id !== undefined) this.requests.delete(reply.id);
    if (this.active && this.url() === APP_ORIGIN + '/index.html') this.emit(reply);
  }
  private async dispatch(request: Request): Promise<string> {
    if (request.method === 'navigation.state') {
      const params = JSON.parse(request.params) as NavigationParams;
      this.canGoBack = params.canGoBack === true;
      return 'null';
    }
    if (request.method === 'camera.photo' || request.method === 'scanner.scan') {
      if (this.mediaBusy) throw new Error('相机或扫码正在使用');
      this.mediaBusy = true;
      try {
        if (request.method === 'camera.photo') return await this.media.photo(JSON.parse(request.params) as PhotoParams);
        return await this.media.scan();
      } finally { this.mediaBusy = false; }
    }
    const params = JSON.parse(request.params) as BleParams;
    switch (request.method) {
      case 'ble.initialize': await this.ble.initialize(); break;
      case 'ble.isEnabled': return JSON.stringify(this.ble.isEnabled());
      case 'ble.requestDevice': return JSON.stringify(await this.ble.requestDevice(params));
      case 'ble.connect': await this.ble.connect(params); break;
      case 'ble.disconnect': this.ble.disconnect(); break;
      case 'ble.read': return JSON.stringify(await this.ble.read(params));
      case 'ble.write': await this.ble.write(params); break;
      case 'ble.notify': await this.ble.notify(params); break;
      case 'ble.readRssi': return JSON.stringify(await this.ble.rssi(params));
      default: throw new Error('不支持的原生方法');
    }
    return 'null';
  }
  suspend(): void { this.ble.dispose(); }
  dispose(): void { this.active = false; this.ble.dispose(); this.requests.clear(); }
}
