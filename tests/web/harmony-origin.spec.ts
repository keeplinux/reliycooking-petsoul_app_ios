import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'

const origin = 'https://app.silifield.local'
const csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; media-src 'self' blob:; object-src 'none'; frame-src 'none'; base-uri 'none'; frame-ancestors 'none'"
const mime: Record<string,string> = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.jpg':'image/jpeg', '.png':'image/png' }

test('鸿蒙安全源与CSP承载生产资源，支持WebCrypto、IndexedDB和原有页面', async ({page}) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route(`${origin}/**`, async route => {
    const pathname = decodeURIComponent(new URL(route.request().url()).pathname)
    const path = resolve('dist', pathname === '/' ? 'index.html' : pathname.slice(1))
    if (!path.startsWith(resolve('dist') + '/')) return route.abort()
    try { await route.fulfill({body:await readFile(path), contentType:mime[extname(path)] ?? 'application/octet-stream', headers:{'Content-Security-Policy':csp,'X-Content-Type-Options':'nosniff'}}) }
    catch { await route.fulfill({status:404,body:''}) }
  })
  await page.goto(`${origin}/index.html`)
  expect(await page.evaluate(async () => {
    const key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt'])
    const iv=crypto.getRandomValues(new Uint8Array(12))
    const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode('配网'))
    const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,cipher)
    await new Promise<void>((ok,fail)=>{const req=indexedDB.open('harmony-origin-check',1);req.onsuccess=()=>{req.result.close();ok()};req.onerror=()=>fail(req.error)})
    return {secure:isSecureContext,plain:new TextDecoder().decode(plain)}
  })).toEqual({secure:true,plain:'配网'})
  await expect(page.locator('input').first()).toHaveValue('13800138000')
  await page.getByRole('button',{name:'登录',exact:true}).click()
  await expect(page.getByRole('button',{name:'扫码',exact:true})).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button',{name:'母舰',exact:true})).toBeVisible()
  expect(errors).toEqual([])
})
