import { UIAbility } from '@kit.AbilityKit';
import { window } from '@kit.ArkUI';
import { webview } from '@kit.ArkWeb';
import { DEBUG } from 'BuildProfile';

export default class EntryAbility extends UIAbility {
  onForeground(): void { AppStorage.setOrCreate('silifieldActive', true); }
  onBackground(): void { AppStorage.setOrCreate('silifieldActive', false); }
  onWindowStageCreate(stage: window.WindowStage): void {
    webview.WebviewController.setWebDebuggingAccess(DEBUG);
    stage.getMainWindow().then((main: window.Window) => {
      main.setPreferredOrientation(window.Orientation.PORTRAIT);
      main.setWindowLayoutFullScreen(false);
    });
    stage.loadContent('pages/Index');
  }
}
