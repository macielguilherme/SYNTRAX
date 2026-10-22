import assert from 'node:assert/strict'
import { mkdirSync, readFileSync } from 'node:fs'
import { chromium } from 'playwright'

const baseUrl = process.env.SYNTRAX_URL || 'http://127.0.0.1:5173/'
const edgePath = process.env.SYNTRAX_BROWSER_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const outputDir = 'C:/Users/SOS Docs/Documents/Codex/2026-10-22/bom-dia-x20/work/syntrax-flow'
mkdirSync(outputDir, { recursive: true })

const browser = await chromium.launch({ executablePath: edgePath, headless: true })
const context = await browser.newContext({ acceptDownloads: true })
const page = await context.newPage()
const errors = []
const dialogs = []
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.accept() })

try {
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  const language = page.locator('.language-picker')
  await language.selectOption('en')
  await page.getByRole('button', { name: 'Tutorial' }).click()
  await page.getByRole('heading', { name: 'Tutorial' }).waitFor({ state: 'visible' })
  await page.getByText('A space to turn goals into plans you can track.').waitFor({ state: 'visible' })
  await language.selectOption('pt')
  await page.getByRole('button', { name: /Visão geral/ }).click()
  await language.selectOption('en')
  await page.getByRole('button', { name: /Create mission/ }).first().click()

  // Required-field validation must block an empty plan.
  await page.getByRole('button', { name: /Propose plan/ }).click()
  await page.getByRole('status').getByText('Informe nome e objetivo para propor um plano.').waitFor({ state: 'visible' })

  await page.getByLabel('Mission name *').fill('QA mission')
  await page.getByLabel('Objective *').fill('Verify the full mission lifecycle')
  await page.getByLabel('Success criteria (one per line)').fill('Plan is recorded\nDeliverables are exportable')
  await page.getByRole('button', { name: /Propose plan/ }).click()
  await page.getByText('4 STEPS · 3 DEPENDENCIES').waitFor({ state: 'visible' })
  await page.getByRole('button', { name: 'Approve & create mission' }).click()

  await page.getByRole('button', { name: 'Start mission' }).click()
  await page.getByRole('button', { name: 'Pause' }).click()
  assert.equal(await page.getByRole('button', { name: /Run next task|Executar próxima tarefa/ }).isEnabled(), false)
  await page.getByRole('button', { name: 'Resume' }).click()

  await page.getByRole('button', { name: 'Edit' }).click()
  await page.getByRole('button', { name: '← Edit details' }).click()
  await page.getByLabel('Mission name *').fill('QA mission edited')
  await page.getByRole('button', { name: /Propose plan/ }).click()
  await page.getByRole('button', { name: 'Save changes' }).click()

  const agentOutputs = [/MISSION CHARTER/, /CONTEXT REVIEW/, /WORKING DRAFT/, /QUALITY REVIEW/]
  for (const [index, agent] of ['ORACLE', 'SCOUT', 'ARCHITECT', 'SENTINEL'].entries()) {
    await page.getByRole('button', { name: /Run next task|Executar próxima tarefa/ }).click()
    await page.getByText(new RegExp(`${index + 1} / 4 tasks complete`)).waitFor({ state: 'visible' })
    await page.getByText(agent, { exact: false }).first().waitFor({ state: 'visible' })
    await page.getByText(agentOutputs[index]).waitFor({ state: 'visible' })
  }
  await page.getByRole('button', { name: 'Complete mission' }).click()
  await page.getByText('COMPLETED').waitFor({ state: 'visible' })

  // Reload proves local persistence, then select the saved mission again.
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /QA mission edited/ }).click()
  await page.getByText('100%').waitFor({ state: 'visible' })
  await page.getByRole('button', { name: 'Deliverables Hub' }).click()

  const jsonDownloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export JSON' }).click()
  const jsonDownload = await jsonDownloadPromise
  const jsonPath = await jsonDownload.path()
  assert.ok(jsonPath, 'JSON export produced a downloadable file')
  const json = readFileSync(jsonPath, 'utf8')
  assert.match(json, /QA mission edited/)
  assert.match(json, /Preparar artefato ou especificação/)

  const markdownDownloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /Export Markdown/ }).click()
  const markdownDownload = await markdownDownloadPromise
  const markdownPath = await markdownDownload.path()
  assert.ok(markdownPath, 'Markdown report produced a downloadable file')
  const markdown = readFileSync(markdownPath, 'utf8')
  assert.match(markdown, /## Plano e resultados/)
  assert.match(markdown, /No external tests, factual verification, deployment checks, or real-world actions were run/)

  await page.getByRole('button', { name: 'Mission Core' }).click()
  await page.getByPlaceholder(/Buscar missões/).fill('missing mission')
  await page.getByText(/No missions found|Nenhuma missão encontrada/).waitFor({ state: 'visible' })
  await page.getByPlaceholder(/Buscar missões/).fill('QA mission edited')
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await page.getByText(/No missions found|Nenhuma missão encontrada/).waitFor({ state: 'visible' })

  assert.ok(dialogs.some(message => message.includes('Conclusão aceita pelo usuário') || message.includes('Confirmar conclusão')))
  assert.equal(errors.length, 0, `Browser console errors: ${errors.join(' | ')}`)
  process.stdout.write('PASS create, validation, plan review, start, pause/resume, edit, ordered task execution, manual completion, persistence, JSON/Markdown exports, filtering, deletion, and browser console.\n')
} finally {
  await browser.close()
}
