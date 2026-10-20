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
  constructor(context: common.UIAbilityContext) { this.context = context; }
  async selectPhoto(): Promise<string[]> {
    const selector = new photoAccessHelper.PhotoViewPicker();
    const selection = await selector.select({ MIMEType: photoAccessHelper.PhotoViewMIMETypes.IMAGE_TYPE, maxSelectNumber: 1 });
    if (selection.photoUris.length === 0) throw new Error('cancelled');
    return selection.photoUris;
  }
  async photo(params: PhotoParams): Promise<string> {
    let uri: string;
    let temporary: string = '';
    if (params.source === 'PHOTOS') {
      uri = (await this.selectPhoto())[0];
    } else {
      temporary = this.context.cacheDir + '/avatar-' + Date.now().toString() + '.jpg';
      const output = fileIo.openSync(temporary, fileIo.OpenMode.CREATE | fileIo.OpenMode.READ_WRITE);
      fileIo.closeSync(output);
      try {
        const result = await cameraPicker.pick(this.context, [cameraPicker.PickerMediaType.PHOTO], {
          cameraPosition: camera.CameraPosition.CAMERA_POSITION_BACK, saveUri: fileUri.getUriFromPath(temporary)
        });
        if (!result.resultUri) throw new Error('cancelled');
        uri = result.resultUri;
      } catch (error) {
        try { fileIo.unlinkSync(temporary); } catch (_) {}
        throw error;
      }
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
      if (temporary !== '') { try { fileIo.unlinkSync(temporary); } catch (_) {} }
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
