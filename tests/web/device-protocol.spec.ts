import { test, expect } from '@playwright/test'
import { createCipheriv, createDecipheriv } from 'node:crypto'
import { frames, FrameReader, open, seal, hex } from '../../src/platform/deviceProtocol'
import { parseQrPayload } from '../../src/provisioning'
const key = 'ab'.repeat(32)
const aad = 'TEST0001:00112233445566778899aabbccddeeff'
test('二维码必须包含真实设备身份及32字节密钥，拒绝缺失与旧随机格式',()=>{
  expect(parseQrPayload(JSON.stringify({v:1,p:'smart-water',sn:'TEST0001',key}))).toEqual({productId:'smart-water',sn:'TEST0001',mac:'',token:key})
  for(const raw of ['PAWLINK:smart-water:TEST0001',JSON.stringify({v:1,p:'smart-water'}),JSON.stringify({v:1,p:'smart-water',sn:'TEST0001',key:'short'}),'https://evil.example/?p=smart-water']) expect(parseQrPayload(raw)).toBeNull()
})
test('App加密可由独立设备端AES-GCM实现解密，密码不以明文传输',async()=>{
  const envelope=JSON.parse(await seal(key,aad+':request',{ssid:'家庭网络',password:'SecretPass123'}))
  const cipher=Buffer.from(envelope.cipher,'hex')
  const decoder=createDecipheriv('aes-256-gcm',Buffer.from(key,'hex'),Buffer.from(envelope.nonce,'hex'))
  decoder.setAAD(Buffer.from(aad+':request'));decoder.setAuthTag(cipher.subarray(-16))
  const plain=Buffer.concat([decoder.update(cipher.subarray(0,-16)),decoder.final()]).toString()
  expect(JSON.parse(plain).ssid).toBe('家庭网络')
  expect(JSON.stringify(envelope)).not.toContain('SecretPass123')
})
test('独立设备端回执可被App解密，错密钥、篡改、旧会话和方向颠倒均失败',async()=>{
  const nonce=Buffer.alloc(12,7),encoder=createCipheriv('aes-256-gcm',Buffer.from(key,'hex'),nonce)
  encoder.setAAD(Buffer.from(aad+':response'))
  const bytes=Buffer.concat([encoder.update(JSON.stringify({requestId:'id',status:'connected',ip:'192.168.1.2'})),encoder.final(),encoder.getAuthTag()])
  const raw=JSON.stringify({v:1,nonce:hex(nonce),cipher:hex(bytes)})
  expect(await open(key,aad+':response',raw)).toMatchObject({status:'connected'})
  await expect(open('cd'.repeat(32),aad+':response',raw)).rejects.toThrow()
  await expect(open(key,'old-session:response',raw)).rejects.toThrow()
  await expect(open(key,aad+':request',raw)).rejects.toThrow()
  bytes[0]^=1
  await expect(open(key,aad+':response',JSON.stringify({v:1,nonce:hex(nonce),cipher:hex(bytes)}))).rejects.toThrow()
})
test('20字节BLE分片支持中文，乱序及超长报文被拒绝',()=>{
  const text=JSON.stringify({ssid:'家庭网络',password:'abcd1234'.repeat(6)})
  const packets=frames(text),reader=new FrameReader();let result
  for(const packet of packets){expect(packet.byteLength).toBeLessThanOrEqual(20);result=reader.push(packet)}
  expect(result).toBe(text)
  expect(()=>new FrameReader().push(packets[1])).toThrow('顺序')
  expect(()=>frames('x'.repeat(2049))).toThrow('过长')
})

test('完整蓝牙传输在设备身份匹配且加密联网回执有效后才返回成功',async()=>{
  const {createHardwareClient}=await import('../../src/platform/hardware')
  const info={v:1,sn:'TEST0001',productId:'smart-water',challenge:'00112233445566778899aabbccddeeff'}
  const payload={productId:'smart-water',sn:'TEST0001',token:key,mac:''}
  const reader=new FrameReader()
  let receive:((v:DataView)=>void)|undefined
  let writtenPassword=''
  const ble={
    initialize:async()=>{}, isEnabled:async()=>true,
    requestDevice:async()=>({deviceId:'ios-device-uuid',name:'SF-TEST0001'}),
    connect:async()=>{},disconnect:async()=>{},readRssi:async()=>-47,
    read:async()=>{const bytes=new TextEncoder().encode(JSON.stringify(info));return new DataView(bytes.buffer)},
    startNotifications:async(_id:string,_service:string,_char:string,cb:(v:DataView)=>void)=>{receive=cb},
    stopNotifications:async()=>{},
    write:async(_id:string,_service:string,_char:string,value:DataView)=>{
      const raw=reader.push(value)
      if(!raw)return
      const request=await open(key,aad+':request',raw) as {password:string;ssid:string;requestId:string}
      writtenPassword=request.password
      const response=await seal(key,aad+':response',{requestId:request.requestId,status:'connected',ip:'192.168.1.30',ssid:request.ssid})
      for(const packet of frames(response))receive!(packet)
    },
  }
  const client=createHardwareClient(ble,()=>true),signal=new AbortController().signal
  expect(await client.connectDevice(payload,signal,()=>{})).toBe(-47)
  const result=await client.provisionDevice(payload,'家庭网络','mypassword',signal,()=>{})
  expect(writtenPassword).toBe('mypassword');expect(result.ip).toBe('192.168.1.30')
  // A disconnected client must not synthesize success.
  await expect(client.provisionDevice(payload,'家庭网络','mypassword',signal,()=>{})).rejects.toThrow('已断开')
})
