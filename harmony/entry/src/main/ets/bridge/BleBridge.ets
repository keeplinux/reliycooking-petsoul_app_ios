import { ble, access, constant } from '@kit.ConnectivityKit';
import { abilityAccessCtrl, common } from '@kit.AbilityKit';
import { BleParams, Device, Emit, SelectDevice, SERVICE, INFO, CONFIG, STATUS } from './Contract';

export class BleBridge {
  private client: ble.GattClientDevice | undefined = undefined;
  private deviceId: string = '';
  private services: ble.GattService[] = [];
  private selected: Set<string> = new Set<string>();
  private scanning: boolean = false;
  private scanCallback: ((results: ble.ScanResult[]) => void) | undefined = undefined;
  private scanTimer: number = -1;
  private scanReject: ((error: Error) => void) | undefined = undefined;
  private context: common.UIAbilityContext;
  private emit: Emit;
  private select: SelectDevice;
  constructor(context: common.UIAbilityContext, emit: Emit, select: SelectDevice) {
    this.context = context; this.emit = emit; this.select = select;
  }
  async initialize(): Promise<void> {
    const result = await abilityAccessCtrl.createAtManager().requestPermissionsFromUser(this.context, ['ohos.permission.ACCESS_BLUETOOTH']);
    if (result.authResults.some((value: number) => value !== 0)) throw new Error('denied: 请允许访问蓝牙');
  }
  isEnabled(): boolean { return access.getState() === access.BluetoothState.STATE_ON; }
  private stopScan(): void {
    clearTimeout(this.scanTimer);
    if (this.scanning) {
      try { ble.stopBLEScan(); } catch (_) {}
      this.scanning = false;
    }
    if (this.scanCallback) {
      try { ble.off('BLEDeviceFind', this.scanCallback); } catch (_) {}
      this.scanCallback = undefined;
    }
  }
  async requestDevice(params: BleParams): Promise<Device> {
    if (!params.services || params.services.length !== 1 || params.services[0].toLowerCase() !== SERVICE) throw new Error('不支持的设备服务');
    if (this.scanning) throw new Error('正在扫描设备');
    if (!this.isEnabled()) throw new Error('请在系统设置中开启蓝牙');
    const devices: Map<string, Device> = new Map<string, Device>();
    await new Promise<void>((resolve, reject) => {
      this.scanReject = reject;
      this.scanCallback = (results: ble.ScanResult[]) => {
        for (const result of results) {
          if (devices.size < 30) devices.set(result.deviceId, { deviceId: result.deviceId, name: result.deviceName || result.deviceId });
        }
      };
      try {
        ble.on('BLEDeviceFind', this.scanCallback);
        ble.startBLEScan([{ serviceUuid: SERVICE }]); this.scanning = true;
        this.scanTimer = setTimeout(() => { this.stopScan(); this.scanReject = undefined; resolve(); }, 6000);
      } catch (error) { this.stopScan(); this.scanReject = undefined; reject(error); }
    });
    if (devices.size === 0) throw new Error('未找到饮水机，请确认设备已进入配网模式');
    const values: Device[] = [];
    devices.forEach((device: Device) => values.push(device));
    const device = await this.select(values);
    this.selected.clear(); this.selected.add(device.deviceId);
    return device;
  }
  async connect(params: BleParams): Promise<void> {
    const id = params.deviceId || '';
    if (!this.selected.has(id)) throw new Error('请先选择附近设备');
    this.disconnect();
    const client = ble.createGattClientDevice(id);
    this.client = client; this.deviceId = id;
    try {
      await new Promise<void>((resolve, reject) => {
        let settled: boolean = false;
        const timer = setTimeout(() => {
          if (!settled) { settled = true; reject(new Error('蓝牙连接超时')); }
        }, Math.min(20000, Math.max(1000, params.timeout || 15000)));
        client.on('BLEConnectionStateChange', (state: ble.BLEConnectionChangeState) => {
          if (state.state === constant.ProfileConnectionState.STATE_CONNECTED && !settled) { settled = true; clearTimeout(timer); resolve(); }
          if (state.state === constant.ProfileConnectionState.STATE_DISCONNECTED) {
            if (!settled) { settled = true; clearTimeout(timer); reject(new Error('蓝牙连接已断开')); }
            this.emit({ event: 'disconnected', deviceId: id });
          }
        });
        client.connect();
      });
      this.services = await client.getServices();
      client.on('BLECharacteristicChange', (value: ble.BLECharacteristic) => {
        if (value.serviceUuid.toLowerCase() === SERVICE && value.characteristicUuid.toLowerCase() === STATUS) {
          this.emit({ event: 'notification', deviceId: id, service: SERVICE, characteristic: STATUS, bytes: Array.from(new Uint8Array(value.characteristicValue)) });
        }
      });
    } catch (error) { this.disconnect(); throw new Error((error as Error).message || "原生能力调用失败"); }
  }
  private characteristic(params: BleParams, expected: string): ble.BLECharacteristic {
    if (!this.client || params.deviceId !== this.deviceId || params.service?.toLowerCase() !== SERVICE || params.characteristic?.toLowerCase() !== expected) throw new Error('无效或未连接的设备特征');
    for (const service of this.services) {
      if (service.serviceUuid.toLowerCase() !== SERVICE) continue;
      for (const characteristic of service.characteristics) {
        if (characteristic.characteristicUuid.toLowerCase() === expected) return characteristic;
      }
    }
    throw new Error('设备不支持当前配网协议');
  }
  async read(params: BleParams): Promise<number[]> {
    const characteristic = this.characteristic(params, INFO);
    const result = await this.client!.readCharacteristicValue(characteristic);
    return Array.from(new Uint8Array(result.characteristicValue));
  }
  async write(params: BleParams): Promise<void> {
    const characteristic = this.characteristic(params, CONFIG);
    const bytes = params.bytes;
    if (!bytes || bytes.length < 3 || bytes.length > 20 || bytes.some((value: number) => !Number.isInteger(value) || value < 0 || value > 255)) throw new Error('无效配网分片');
    const buffer = new ArrayBuffer(bytes.length);
    new Uint8Array(buffer).set(bytes);
    characteristic.characteristicValue = buffer;
    await this.client!.writeCharacteristicValue(characteristic, ble.GattWriteType.WRITE);
  }
  async notify(params: BleParams): Promise<void> {
    const characteristic = this.characteristic(params, STATUS);
    await this.client!.setCharacteristicChangeNotification(characteristic, params.enabled === true);
  }
  async rssi(params: BleParams): Promise<number> {
    if (!this.client || params.deviceId !== this.deviceId) throw new Error('设备已断开');
    return this.client.getRssiValue();
  }
  disconnect(): void {
    const client = this.client;
    const id = this.deviceId;
    this.client = undefined; this.services = []; this.deviceId = '';
    if (client) {
      try { client.disconnect(); } catch (_) {}
      try { client.off('BLECharacteristicChange'); client.off('BLEConnectionStateChange'); client.close(); } catch (_) {}
      this.emit({ event: 'disconnected', deviceId: id });
    }
  }
  dispose(): void {
    this.stopScan();
    if (this.scanReject) { this.scanReject(new Error('扫描已取消')); this.scanReject = undefined; }
    this.selected.clear(); this.disconnect();
  }
}
