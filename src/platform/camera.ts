import { Camera as CapacitorCamera } from '@capacitor/camera'
import type { CameraOptions, Photo } from '@capacitor/camera'

export { CameraResultType, CameraSource } from '@capacitor/camera'

/** iOS/Android use Capacitor. A future Harmony shell supplies the same contract. */
export interface CameraAdapter {
  getPhoto(options: CameraOptions): Promise<Photo>
}

let adapter: CameraAdapter = CapacitorCamera

/** Call before mounting React when integrating another native host. */
export function configureCameraAdapter(next: CameraAdapter): void {
  adapter = next
}

export const Camera: CameraAdapter = {
  getPhoto: (options) => adapter.getPhoto(options),
}
