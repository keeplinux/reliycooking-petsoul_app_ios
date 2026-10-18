import { KeyboardResize } from '@capacitor/keyboard'
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.pawlink.petwater',
  appName: 'silifield',
  webDir: 'dist',
  plugins: {
    Keyboard: { resize: KeyboardResize.Native },
  },
  server: {
    androidScheme: 'https',
  },
}

export default config
