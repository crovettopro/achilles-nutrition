import { chromium } from 'playwright'

const base = 'http://localhost:8787'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })

// Log in as the demo athlete via the API, then inject the token.
const res = await page.request.post(`${base}/api/auth/login`, {
  data: { email: 'crovettopro@gmail.com', password: 'aquilles123' },
})
const { token } = await res.json()
await page.goto(base)
await page.evaluate((t) => localStorage.setItem('achilles:token', t), token)
await page.goto(`${base}/progress`)
await page.waitForTimeout(1500)
await page.screenshot({ path: '/tmp/progress.png', fullPage: true })
console.log('shot saved')
await browser.close()
