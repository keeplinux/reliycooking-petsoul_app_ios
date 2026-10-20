export const APP_ORIGIN: string = 'https://app.silifield.local';
export const SERVICE: string = '28a00001-8c31-4a3b-9d61-425350455431';
export const INFO: string = '28a00002-8c31-4a3b-9d61-425350455431';
export const CONFIG: string = '28a00003-8c31-4a3b-9d61-425350455431';
export const STATUS: string = '28a00004-8c31-4a3b-9d61-425350455431';
export interface Request { id: number; method: string; params: string; }
export interface Reply { id?: number; result?: string; error?: string; event?: string; deviceId?: string; service?: string; characteristic?: string; bytes?: number[]; }
export interface BleParams { deviceId?: string; services?: string[]; service?: string; characteristic?: string; bytes?: number[]; enabled?: boolean; timeout?: number; }
export interface Device { deviceId: string; name: string; }
export interface PhotoParams { source?: string; }
export type Emit = (reply: Reply) => void;
export type SelectDevice = (devices: Device[]) => Promise<Device>;

export interface NavigationParams { canGoBack: boolean; }
