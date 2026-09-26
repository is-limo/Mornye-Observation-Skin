import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildDesktop, root } from '../scripts/build-desktop.mjs'
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const bundle = buildDesktop()
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) })
const page = await browser.newPage({ viewport: { width: 1440, height: 980 } })
page.setDefaultTimeout(5000)
const errors = []
page.on('pageerror', error => errors.push(error.message))
const html = `<!doctype html><html data-windows-titlebar style="--dsh-windows-titlebar-height:40px"><head><meta charset="utf-8">
<style>html,body,#root{height:100%;margin:0}body{font-family:Segoe UI,sans-serif}.fixture_frame{height:100%;box-sizing:border-box;display:grid;grid-template-columns:250px minmax(0,1fr) 0;overflow:hidden}.fixture_sidebarCol{background:#f1f5fb;padding:20px}.fixture_centerCol{min-width:0;overflow:auto}.fixture_root{padding:28px}.fixture_bubble{background:#eaf0f9;padding:14px;border-radius:14px}section{margin:24px 0}.fixture_body{line-height:1.8}.fixture_composer{border:1px solid #ccd4e3;border-radius:16px;padding:20px;margin-top:40px}button{font:inherit}</style>
<style data-plugin-css="fixture/AppFrame.module.css">.fixture_frame{}.fixture_sidebarCol{}.fixture_centerCol{}</style>
<style data-plugin-css="fixture/ChatView.module.css">.fixture_root{}</style>
<style data-plugin-css="fixture/MessageItem.module.css">.fixture_bubble{}</style>
<style data-plugin-css="fixture/AssistantMarkdown.module.css">.fixture_body{}</style>
<style data-plugin-css="fixture/StatsLine.module.css">.fixture_stats{}</style>
</head><body><div id="root"><div class="fixture_frame" data-rightbar-collapsed><aside class="fixture_sidebarCol"><h3>deepseek HARNESS</h3><p>＋ 新会话</p><hr><p>工作区</p><p>莫宁 · 观测记录</p></aside><main class="fixture_centerCol"><div class="fixture_root"><h2>安静地，观察每一次灵感</h2><p>对话　　轨迹</p><section data-chat-flow-kind="user"><div class="fixture_bubble">帮我整理今天的设计方向。</div></section><section data-chat-flow-kind="assistant-step"><div class="fixture_body">让工作台像一页安静的观测笔记。<p>保留清晰的层次，使用低饱和蓝灰、细线轨道和克制的金色刻度，让信息自然落在它应该在的位置。</p><pre>PRIVATE_CODE_EXCLUDED</pre><div hidden>HIDDEN_EXCLUDED</div></div><div class="fixture_reasoning">REASONING_EXCLUDED</div></section><section data-chat-flow-kind="user"><div class="fixture_bubble">外观设置和聊天导航也保留。</div></section><section data-chat-flow-kind="assistant-step"><div class="fixture_body">已保留。外观只在本地保存，对话导航仅整理当前页面已加载的正文。</div></section><div class="fixture_composer" contenteditable>继续观测，记录新的想法…</div></div></main><aside></aside></div></div></body></html>`
try {
await page.route('http://mornye.test/', route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: html }))
await page.goto('http://mornye.test/')
await page.evaluate(() => { window.__ModuleLoader__ = { load(entry) { window.skin = entry.factory() } } })
await page.addScriptTag({ content: bundle.client })
await page.evaluate(() => window.skin.apply({ effect(start) { window.disposeSkin = start() } }))
await page.waitForSelector('body[data-mornye-rail="true"]')
assert.equal(await page.locator('#mornye-activity-list button').count(), 3)
await page.evaluate(() => { const stats = document.createElement('div'); stats.dataset.composerStats = ''; stats.textContent = '2 轮 4 步 · 缓存命中 87%'; document.querySelector('.fixture_root').append(stats) })
await page.waitForFunction(() => document.querySelector('#mornye-cache-hit').textContent === '87%')
assert.equal(await page.locator('#mornye-stat-turn').textContent(), '2')
assert.equal(await page.locator('#mornye-stat-steps').textContent(), '4')
assert.match(await page.locator('#mornye-loaded-count').textContent(), /^4 LOADED$/)
assert.equal(await page.locator('[data-mornye-center]').evaluate(el => getComputedStyle(el).paddingRight), '288px')
assert.equal(await page.locator('#mornye-appearance-panel').isVisible(), false)
await page.locator('#mornye-appearance-toggle').click()
assert.equal(await page.locator('#mornye-appearance-panel').isVisible(), true)
await page.locator('[data-mornye-accent="gold"]').click()
await page.locator('#mornye-motion-preset').selectOption('still')
assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('mornye.desktop.appearance.v1')).accent), 'gold')
await page.keyboard.press('Escape')
assert.equal(await page.locator('#mornye-appearance-panel').isVisible(), false)
await page.locator('#mornye-history-search summary').click()
await page.locator('#mornye-dialog-query').fill('PRIVATE_CODE_EXCLUDED')
assert.equal(await page.locator('#mornye-search-results button').count(), 0)
await page.locator('#mornye-dialog-query').fill('REASONING_EXCLUDED')
assert.equal(await page.locator('#mornye-search-results button').count(), 0)
await page.locator('#mornye-dialog-query').fill('设计方向')
await page.waitForFunction(() => document.querySelector('#mornye-search-count').textContent === '1 MATCHES')
assert.equal(await page.locator('#mornye-search-results button').count(), 1)
await page.locator('#mornye-search-results button').click()
assert.equal(await page.locator('[data-mornye-conversation-focus]').count(), 1)
const stored = await page.evaluate(() => JSON.stringify(Object.entries(localStorage)))
assert.ok(!stored.includes('设计方向') && !stored.includes('PRIVATE_CODE'))
await page.evaluate(() => document.querySelector('.fixture_frame').removeAttribute('data-rightbar-collapsed'))
await page.waitForSelector('body[data-mornye-rail="false"]')
assert.equal(await page.locator('#mornye-observation-panel').isVisible(), false)
assert.equal(await page.locator('[data-mornye-center]').evaluate(el => getComputedStyle(el).paddingRight), '0px')
await page.evaluate(() => document.querySelector('.fixture_frame').setAttribute('data-rightbar-collapsed', ''))
for (const width of [1000, 760, 480]) {
  await page.setViewportSize({ width, height: 800 })
  await page.waitForSelector('body[data-mornye-rail="false"]')
  assert.equal(await page.locator('#mornye-observation-panel').isVisible(), false)
  await page.locator('#mornye-appearance-toggle').click()
  assert.equal(await page.locator('#mornye-appearance-panel').isVisible(), true)
  await page.keyboard.press('Escape')
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
}
await page.setViewportSize({ width: 1440, height: 980 })
await page.evaluate(() => document.body.setAttribute('data-ds-dark-theme', ''))
await page.waitForSelector('body[data-mornye-desktop="dark"]')
assert.equal(await page.locator('#mornye-skin-layer').isVisible(), false)
await page.evaluate(() => document.body.removeAttribute('data-ds-dark-theme'))
await page.waitForSelector('body[data-mornye-desktop="ready"]')
await page.emulateMedia({ reducedMotion: 'reduce' })
assert.equal(await page.locator('.mornye-observation__scan').evaluate(el => getComputedStyle(el).animationName), 'none')
// Take a shareable preview containing only the synthetic text declared above.
mkdirSync(resolve(root, 'docs'), { recursive: true })
await page.locator('#mornye-appearance-toggle').click()
await page.locator('[data-mornye-action="reset"]').click()
await page.keyboard.press('Escape')
await page.waitForTimeout(2100)
await page.evaluate(() => { document.querySelector('pre').remove(); document.querySelector('.fixture_reasoning').remove(); document.activeElement?.blur() })
await page.screenshot({ path: resolve(root, 'docs/desktop-preview.png') })
await page.evaluate(() => window.disposeSkin())
assert.equal(await page.locator('#mornye-skin-layer, #mornye-desktop-style, [data-mornye-frame]').count(), 0)
assert.equal(await page.locator('.fixture_frame').evaluate(el => getComputedStyle(el).paddingTop), '0px')
await page.evaluate(() => window.skin.apply({ effect(start) { window.disposeSkin = start() } }))
await page.waitForSelector('body[data-mornye-desktop="ready"]')
assert.equal(await page.locator('#mornye-skin-layer').count(), 1)
assert.deepEqual(errors, [])
console.log('Desktop browser checks passed: lifecycle, navigation privacy, settings, native panel, responsive layout, dark mode and reduced motion.')
} finally { await browser.close() }
