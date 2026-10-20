import { UIAbility } from '@kit.AbilityKit';
import { window } from '@kit.ArkUI';

export default class EntryAbility extends UIAbility {
  onForeground(): void { AppStorage.setOrCreate('silifieldActive', true); }
  onBackground(): void { AppStorage.setOrCreate('silifieldActive', false); }
  onWindowStageCreate(stage: window.WindowStage): void {
    stage.getMainWindow().then((main: window.Window) => {
      main.setPreferredOrientation(window.Orientation.PORTRAIT);
      main.setWindowLayoutFullScreen(false);
    });
    stage.loadContent('pages/Index');
  }
}
