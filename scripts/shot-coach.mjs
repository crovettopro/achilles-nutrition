import { chromium } from 'playwright'

const base = 'http://localhost:8787'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })

const res = await page.request.post(`${base}/api/auth/login`, {
  data: { email: 'alejandrodiosfdz@gmail.com', password: 'aquilles123' },
})
const { token } = await res.json()
await page.goto(base)
await page.evaluate((t) => localStorage.setItem('achilles:token', t), token)
await page.goto(`${base}/coach/athlete/athlete-crovetto`)
await page.waitForTimeout(1500)
await page.screenshot({ path: '/tmp/coach-athlete.png', fullPage: true })
console.log('shot saved')
await browser.close()
