import { chromium } from 'playwright'

const base = 'http://localhost:8787'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })

const res = await page.request.post(`${base}/api/auth/login`, {
  data: { email: 'crovettopro@gmail.com', password: 'aquilles123' },
})
const { token } = await res.json()
await page.goto(base)
await page.evaluate((t) => localStorage.setItem('achilles:token', t), token)

// Home — daily targets panel
await page.goto(`${base}/home`)
await page.waitForTimeout(1500)
await page.screenshot({ path: '/tmp/feat-home.png', fullPage: true })

// Weekend — open Alcohol Mode, pick copas
await page.goto(`${base}/weekend`)
await page.waitForTimeout(800)
await page.getByText('Voy a beber hoy').click()
await page.waitForTimeout(300)
await page.getByText('Voy a tomar copas').click()
await page.waitForTimeout(300)
await page.getByText('Ver estrategia').click()
await page.waitForTimeout(6000) // wait for AI
await page.screenshot({ path: '/tmp/feat-weekend.png', fullPage: true })

// Scan — text describe flow → result
await page.goto(`${base}/scan`)
await page.waitForTimeout(800)
await page.getByLabel('Describe tu comida').fill('Pollo a la plancha con arroz y aguacate')
await page.getByLabel('Describe tu comida').press('Enter')
await page.waitForTimeout(9000) // wait for AI analysis
await page.screenshot({ path: '/tmp/feat-scan.png', fullPage: true })

console.log('shots saved')
await browser.close()
