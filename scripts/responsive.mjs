import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const baseUrl = process.env.SYNTRAX_URL || 'http://127.0.0.1:5173/'
const edgePath = process.env.SYNTRAX_BROWSER_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const screenshotDir = 'C:/Users/SOS Docs/Documents/Codex/2026-10-22/bom-dia-x20/work/syntrax-responsive'
const widths = [320, 375, 430, 768, 1024, 1440, 1920]
mkdirSync(screenshotDir, { recursive: true })

const browser = await chromium.launch({ executablePath: edgePath, headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const errors = []
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })

try {
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  const language = page.locator('.language-picker')
  await language.selectOption('en')
  await page.getByRole('button', { name: 'Tutorial' }).click()
  await page.getByRole('heading', { name: 'Tutorial' }).waitFor({ state: 'visible' })
  await page.getByText('MISSION', { exact: true }).waitFor({ state: 'visible' })
  await language.selectOption('pt')
  await page.getByRole('button', { name: /Visão geral/ }).waitFor({ state: 'visible' })
  await language.selectOption('en')
  await page.getByRole('button', { name: /Agent Network/ }).waitFor({ state: 'visible' })
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 })
    await page.waitForTimeout(100)
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      root: document.querySelector('#root')?.getBoundingClientRect().width,
    }))
    if (dimensions.document > dimensions.viewport) {
      throw new Error(`${width}px viewport overflows horizontally: ${JSON.stringify(dimensions)}`)
    }

    await page.screenshot({ path: `${screenshotDir}/syntrax-${width}.png` })
    await page.getByRole('button', { name: /Agent Network/ }).click()
    await page.getByRole('heading', { name: 'Specialized agents' }).waitFor({ state: 'visible' })
    await page.getByRole('button', { name: /Overview/ }).click()
    await page.getByRole('heading', { name: /Engineer the impossible/ }).waitFor({ state: 'visible' })

    if (width <= 430) {
      await page.getByRole('button', { name: /Create mission/ }).first().click()
      const box = await page.getByRole('dialog').evaluate(element => {
        const rect = element.getBoundingClientRect()
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }
      })
      if (box.left < 0 || box.right > width || box.bottom > 900) {
        throw new Error(`Mission modal does not fit ${width}px viewport: ${JSON.stringify(box)}`)
      }
      await page.getByRole('button', { name: 'Close' }).click()
    }
    process.stdout.write(`PASS ${width}px: ${JSON.stringify(dimensions)}\n`)
  }
  if (errors.length) throw new Error(`Browser console errors: ${errors.join(' | ')}`)
  process.stdout.write('PASS no browser console errors\n')
} finally {
  await browser.close()
}
