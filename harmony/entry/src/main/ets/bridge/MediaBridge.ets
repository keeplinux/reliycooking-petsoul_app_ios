import { common } from '@kit.AbilityKit';
import { camera, cameraPicker } from '@kit.CameraKit';
import { photoAccessHelper } from '@kit.MediaLibraryKit';
import { fileIo, fileUri } from '@kit.CoreFileKit';
import { image } from '@kit.ImageKit';
import { util } from '@kit.ArkTS';
import { scanBarcode, scanCore } from '@kit.ScanKit';
import { PhotoParams } from './Contract';

export class MediaBridge {
  private context: common.UIAbilityContext;
  private captureFiles: Set<string> = new Set<string>();
  private selecting: boolean = false;
  constructor(context: common.UIAbilityContext) { this.context = context; }
  async selectPhoto(): Promise<string[]> {
    return this.selectFiles(['image/*'], false);
  }
  async selectFiles(accept: string[], capture: boolean): Promise<string[]> {
    if (this.selecting) throw new Error('相机或相册正在使用');
    this.selecting = true;
    try {
      // API 12/13 ArkWeb expands accept MIME patterns into extensions.
      const imageTypes = ['.tif', '.pjp', '.jfif', '.bmp', '.webp', '.svg', '.gif', '.svgz', '.jpg', '.hevc', '.jpeg', '.pjpeg', '.png', '.ico', '.avif', '.apng', '.heic', '.xbm', '.tiff', '.heif'];
      const videoTypes = ['.ogm', '.ogv', '.mpg', '.mp4', '.mpeg', '.m4v', '.webm', '.mov', '.3gp', '.mkv'];
      const video = accept.some((type: string) => type.startsWith('video/') || videoTypes.includes(type.toLowerCase()));
      const photo = accept.some((type: string) => type.startsWith('image/') || imageTypes.includes(type.toLowerCase()));
      if (!photo && !video) throw new Error('仅支持选择图片或视频');
      if (capture) return [await this.capture(video && !photo)];
      const mime = video ? (photo ? photoAccessHelper.PhotoViewMIMETypes.IMAGE_VIDEO_TYPE :
        photoAccessHelper.PhotoViewMIMETypes.VIDEO_TYPE) : photoAccessHelper.PhotoViewMIMETypes.IMAGE_TYPE;
      return await this.pickMedia(mime);
    } finally { this.selecting = false; }
  }
  private async pickMedia(mime: photoAccessHelper.PhotoViewMIMETypes): Promise<string[]> {
    const selector = new photoAccessHelper.PhotoViewPicker();
    const selection = await selector.select({ MIMEType: mime, maxSelectNumber: 1 });
    if (selection.photoUris.length === 0) throw new Error('cancelled');
    return selection.photoUris;
  }
  private async capture(video: boolean): Promise<string> {
    const path = this.context.cacheDir + '/silifield-webcapture-' + Date.now().toString() + (video ? '.mp4' : '.jpg');
    const output = fileIo.openSync(path, fileIo.OpenMode.CREATE | fileIo.OpenMode.READ_WRITE);
    fileIo.closeSync(output);
    this.captureFiles.add(path);
    try {
      const result = await cameraPicker.pick(this.context, [video ? cameraPicker.PickerMediaType.VIDEO : cameraPicker.PickerMediaType.PHOTO], {
        cameraPosition: camera.CameraPosition.CAMERA_POSITION_BACK, saveUri: fileUri.getUriFromPath(path)
      });
      if (!result) throw new Error('系统相机未返回结果，请在 HarmonyOS NEXT 真机上重试');
      if (result.resultCode !== 0 || !result.resultUri) throw new Error('cancelled');
      return result.resultUri;
    } catch (error) {
      this.removeCapture(path);
      throw new Error((error as Error).message || '原生能力调用失败');
    }
  }
  private removeCapture(path: string): void {
    try { fileIo.unlinkSync(path); } catch (_) {}
    this.captureFiles.delete(path);
  }
  dispose(): void {
    this.captureFiles.forEach((path: string) => { try { fileIo.unlinkSync(path); } catch (_) {} });
    this.captureFiles.clear();
  }
  async photo(params: PhotoParams): Promise<string> {
    let uri: string;
    let temporary: string = '';
    if (params.source === 'PHOTOS') {
      uri = (await this.selectPhoto())[0];
    } else {
      uri = (await this.selectFiles(['image/*'], true))[0];
      temporary = new fileUri.FileUri(uri).path;
    }
    const file = fileIo.openSync(uri, fileIo.OpenMode.READ_ONLY);
    const source = image.createImageSource(file.fd);
    const packer = image.createImagePacker();
    let pixels: image.PixelMap | undefined = undefined;
    try {
      const info = await source.getImageInfo();
      const ratio = Math.min(1, 1024 / Math.max(info.size.width, info.size.height));
      pixels = await source.createPixelMap({ desiredSize: { width: Math.max(1, Math.round(info.size.width * ratio)), height: Math.max(1, Math.round(info.size.height * ratio)) } });
      const jpeg = await packer.packing(pixels, { format: 'image/jpeg', quality: 85 });
      if (jpeg.byteLength > 2 * 1024 * 1024) throw new Error('图片超过大小限制');
      const encoded = new util.Base64Helper().encodeToStringSync(new Uint8Array(jpeg));
      return JSON.stringify({ dataUrl: 'data:image/jpeg;base64,' + encoded, format: 'jpeg', saved: false });
    } finally {
      if (pixels) await pixels.release();
      await packer.release(); await source.release(); fileIo.closeSync(file);
      if (temporary !== '') this.removeCapture(temporary);
    }
  }
  async scan(): Promise<string> {
    const result = await scanBarcode.startScanForResult(this.context, {
      scanTypes: [scanCore.ScanType.QR_CODE], enableMultiMode: false
    });
    if (!result.originalValue) throw new Error('未识别到二维码');
    return JSON.stringify(result.originalValue);
  }
}
