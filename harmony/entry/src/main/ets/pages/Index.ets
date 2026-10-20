import { webview } from '@kit.ArkWeb';
import { common } from '@kit.AbilityKit';
import { APP_ORIGIN, Device, Reply } from '../bridge/Contract';
import { JsProxy } from '../bridge/JsProxy';

@Entry
@Component
struct Index {
  private controller: webview.WebviewController = new webview.WebviewController();
  private proxy: JsProxy = new JsProxy(
    getContext(this) as common.UIAbilityContext,
    (reply: Reply) => this.deliver(reply),
    (devices: Device[]) => this.chooseDevice(devices),
    () => this.controller.getUrl()
  );
  @StorageLink('silifieldActive') @Watch('onActiveChanged') private active: boolean = true;
  private onActiveChanged(): void {
    if (!this.active) { this.cancelChoice(); this.proxy.suspend(); }
  }
  @State private devices: Device[] = [];
  @State private choosing: boolean = false;
  private chooseResolve: ((device: Device) => void) | undefined = undefined;
  private chooseReject: ((error: Error) => void) | undefined = undefined;
  private choiceTimer: number = -1;

  private deliver(reply: Reply): void {
    if (this.controller.getUrl() !== APP_ORIGIN + '/index.html') return;
    this.controller.runJavaScript(`window.dispatchEvent(new CustomEvent('silifield:native',{detail:${JSON.stringify(reply)}}))`).catch(() => {});
  }
  private chooseDevice(devices: Device[]): Promise<Device> {
    this.devices = devices; this.choosing = true;
    return new Promise<Device>((resolve, reject) => {
      this.chooseResolve = resolve; this.chooseReject = reject;
      this.choiceTimer = setTimeout(() => this.cancelChoice(), 45000);
    });
  }
  private cancelChoice(): void {
    this.chooseReject?.(new Error('cancelled: 已取消选择设备'));
    this.finishChoice();
  }
  private finishChoice(): void {
    clearTimeout(this.choiceTimer); this.choosing = false;
    this.chooseResolve = undefined; this.chooseReject = undefined;
  }
  private resource(requestUrl: string): WebResourceResponse {
    const response = new WebResourceResponse();
    response.setResponseIsReady(true);
    response.setResponseEncoding('utf-8');
    response.setResponseCode(403); response.setReasonMessage('Forbidden'); response.setResponseData('');
    if (!requestUrl.startsWith(APP_ORIGIN + '/')) return response;
    try {
      let path = decodeURIComponent(requestUrl.substring(APP_ORIGIN.length + 1).split('?')[0].split('#')[0]);
      if (path === '') path = 'index.html';
      if (path.includes('..') || path.includes('\\') || path.startsWith('/') || path.includes('\u0000')) return response;
      const bytes = (getContext(this) as common.UIAbilityContext).resourceManager.getRawFileContentSync('public/' + path);
      const extension = path.substring(path.lastIndexOf('.') + 1).toLowerCase();
      let mime: string = 'application/octet-stream';
      switch (extension) {
        case 'html': mime = 'text/html'; break;
        case 'js': mime = 'application/javascript'; break;
        case 'css': mime = 'text/css'; break;
        case 'json': mime = 'application/json'; break;
        case 'svg': mime = 'image/svg+xml'; break;
        case 'png': mime = 'image/png'; break;
        case 'jpg': case 'jpeg': mime = 'image/jpeg'; break;
        case 'webp': mime = 'image/webp'; break;
        case 'woff2': mime = 'font/woff2'; break;
        case 'woff': mime = 'font/woff'; break;
        case 'ttf': mime = 'font/ttf'; break;
      }
      response.setResponseMimeType(mime);
      response.setResponseCode(200); response.setReasonMessage('OK');
      response.setResponseData(bytes.buffer);
      response.setResponseHeader([
        { headerKey: 'X-Content-Type-Options', headerValue: 'nosniff' },
        { headerKey: 'Content-Security-Policy', headerValue: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; media-src 'self' blob:; object-src 'none'; frame-src 'none'; base-uri 'none'; frame-ancestors 'none'" }
      ]);
    } catch (_) { response.setResponseCode(404); response.setReasonMessage('Not Found'); }
    return response;
  }
  aboutToDisappear(): void { this.cancelChoice(); this.proxy.dispose(); }
  onBackPress(): boolean {
    if (this.choosing) { this.cancelChoice(); return true; }
    if (!this.proxy.canGoBack) return false;
    this.controller.runJavaScript("document.querySelector('button[aria-label=\"返回\"]')?.click()");
    return true;
  }
  build() {
    Stack() {
      Web({ src: APP_ORIGIN + '/index.html', controller: this.controller })
        .width('100%').height('100%')
        .javaScriptAccess(true)
        .domStorageAccess(true)
        .databaseAccess(true)
        .fileAccess(false)
        .mixedMode(MixedMode.None)
        .javaScriptProxy({ object: this.proxy, name: 'SilifieldNative', methodList: ['invoke'], controller: this.controller })
        .onInterceptRequest((event) => event ? this.resource(event.request.getRequestUrl()) : new WebResourceResponse())
        .onLoadIntercept((event) => !event.data.getRequestUrl().startsWith(APP_ORIGIN + '/'))
        .onShowFileSelector((event) => {
          if (!event) return false;
          this.proxy.media.selectPhoto().then((uris: string[]) => event.result.handleFileList(uris))
            .catch(() => event.result.handleFileList([]));
          return true;
        })
      if (this.choosing) {
        Column({ space: 12 }) {
          Text('选择饮水机').fontSize(20).fontColor('#171717')
          List() {
            ForEach(this.devices, (device: Device) => {
              ListItem() {
                Button(device.name).width('100%').onClick(() => {
                  this.chooseResolve?.(device); this.finishChoice();
                })
              }
            }, (device: Device) => device.deviceId)
          }.height(260)
          Button('取消').onClick(() => this.cancelChoice())
        }.padding(24).width('90%').backgroundColor('#F7F7F8').borderRadius(16)
      }
    }.width('100%').height('100%').backgroundColor('#F7F7F8')
  }
}
