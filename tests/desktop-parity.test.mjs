// Synthetic desktop DOM: no profile, model requests, or personal conversations.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { buildDesktop } from '../scripts/build-desktop.mjs'
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
const failures = []
async function check(name, run) { try { await run(); console.log('PASS', name) } catch (error) { failures.push(name + ': ' + error.message); console.log('FAIL', name, error.message) } }
const style = (name, css) => `<style data-plugin-css="fixture/${name}.module.css">${css}</style>`
const html = `<!doctype html><html data-windows-titlebar><head><meta charset="utf-8">
<style>body{margin:0}button{font:inherit}.app_frame{display:grid;grid-template-columns:250px minmax(0,1fr);height:100vh;box-sizing:border-box}.app_frame[data-sidebar-collapsed="true"]{grid-template-columns:0 minmax(0,1fr)}.app_sidebarCol{overflow:hidden}.app_centerCol{min-width:0}.conversation_body{height:680px;display:flex;flex-direction:column}.chat_root{flex:1;min-height:0}.chat_scroll{height:100%;overflow:auto;box-sizing:border-box}.chat_column{display:flex;flex-direction:column}.input_card{border-radius:24px}.message_bubble{border-radius:20px}.css-hidden{display:none}.veil{visibility:hidden}</style>
${style('AppFrame', '.app_frame{}.app_sidebarCol{}.app_centerCol{}')}
${style('ConversationRoot', '.conversation_body{}.conversation_header{}.conversation_tabs{}')}
${style('ChatView', '.chat_root{}.chat_scroll{}.chat_column{}')}
${style('InputBar', '.input_root{}.input_card{}.input_primary{}')}
${style('SidebarRoot', '.sidebar_root{}.sidebar_newSession{}.sidebar_regionArea{}')}
${style('MessageItem', '.message_bubble{}')}
${style('MessageIconActions', '.-\\38 1time_timeStart{}.clock_timeEnd{}')}
${style('AssistantMarkdown', '.answer_body{}.answer_actions{}')}
${style('ReasoningRow', '.reason_root{}')}
${style('TurnProcessNodeView', '.process_label{}')}
</head><body><div class="app_frame" data-rightbar-collapsed><aside class="app_sidebarCol"><div class="sidebar_root"><button class="sidebar_newSession">新会话</button><div class="sidebar_regionArea">工作区</div></div></aside><main class="app_centerCol"><header class="conversation_header">示例会话<div class="conversation_tabs">对话</div></header><div class="conversation_body"><div class="chat_root"><div class="chat_scroll"><div class="chat_column">
<section data-chat-flow-kind="user"><div class="message_bubble">整理设计 <a href="https://example.test/?token=PRIVATE_URL">链接</a></div><span class="-81time_timeStart">10:30</span></section>
<section data-chat-flow-kind="turn-process"><button data-turn-process="demo"><span class="process_label">用时12秒</span></button></section>
<section data-chat-flow-kind="assistant-step"><div class="answer_body">可见正文<span class="css-hidden">CSS_HIDDEN_CANARY</span><span class="veil">INVISIBLE_CANARY</span><div class="reason_root">REASONING_CANARY</div><pre>CODE_CANARY</pre><details><summary>折叠说明</summary>CLOSED_DETAILS_CANARY</details><p>https://example.test/?token=URL_CANARY</p></div><span class="clock_timeEnd">10:31</span></section>
<section data-chat-flow-kind="turn-tail"></section>
</div></div></div><div class="input_root"><div class="input_card">输入框<button class="input_primary">发送</button></div><div data-composer-stats>1 轮 2 步 · 缓存命中 87%</div></div></div></main></div></body></html>`
const settle = () => page.waitForTimeout(100)
const computed = (selector, property, pseudo) => page.locator(selector).first().evaluate((el, args) => getComputedStyle(el, args.pseudo)[args.property], {property, pseudo})
try {
  await page.route('http://mornye.test/', route => route.fulfill({ contentType: 'text/html', body: html }))
  await page.goto('http://mornye.test/')
  await page.evaluate(() => { window.__ModuleLoader__ = {load(entry) {window.skin = entry.factory()}} })
  await page.addScriptTag({ content: buildDesktop().client })
  await page.evaluate(() => window.skin.apply({effect(start) {window.dispose = start()}}))
  await settle()
  await check('composer, bubbles and sidebar retain design details', async () => {
    assert.equal(await computed('.input_card', 'borderRadius'), '14px')
    assert.equal(await computed('.input_primary', 'borderRadius'), '10px')
    assert.equal(await computed('.message_bubble', 'borderRadius'), '12px')
    assert.equal(await computed('.sidebar_newSession', 'backgroundColor'), 'rgba(0, 0, 0, 0)')
    assert.equal(await computed('.sidebar_regionArea', 'borderTopWidth'), '1px')
    assert.equal(await computed('.chat_column', 'rowGap'), '20px')
  })
  await check('native message timestamps and speaker markers', async () => {
    assert.deepEqual(await page.locator('#mornye-activity-list time').allTextContents(), ['10:31', '10:30'])
    assert.equal(await page.locator('#mornye-activity-list li[data-speaker="user"]').count(), 1)
  })
  await check('accent visibly indicates the selected color', async () => {
    await page.locator('#mornye-appearance-toggle').click()
    await page.locator('[data-mornye-accent="gold"]').click()
    assert.notEqual(await computed('button[data-mornye-accent="gold"]', 'boxShadow'), 'none')
    assert.equal(await computed('button[data-mornye-accent="orbit"]', 'boxShadow'), 'none')
  })
  await page.keyboard.press('Escape')
  await check('navigator excludes invisible text and URL parameters', async () => {
    await page.locator('#mornye-history-search summary').click()
    for (const query of ['CSS_HIDDEN_CANARY','INVISIBLE_CANARY','CLOSED_DETAILS_CANARY','REASONING_CANARY','CODE_CANARY','URL_CANARY','PRIVATE_URL']) {
      await page.locator('#mornye-dialog-query').fill(query)
      await settle()
      assert.equal(await page.locator('#mornye-search-results button').count(), 0, query)
    }
  })
  await page.keyboard.press('Escape')
  await check('completion state is projected from the latest native turn', async () => {
    assert.equal(await page.locator('#mornye-session-state').textContent(), 'DONE')
  })
  await check('long responses are located at their beginning', async () => {
    await page.evaluate(() => document.querySelector('.answer_body').style.minHeight='1600px')
    await page.locator('#mornye-appearance-toggle').click()
    await page.locator('#mornye-motion-preset').selectOption('still')
    await page.keyboard.press('Escape')
    await page.locator('#mornye-activity-list button').first().click()
    const offset = await page.evaluate(() => document.querySelector('[data-chat-flow-kind="assistant-step"]').getBoundingClientRect().top - document.querySelector('.chat_scroll').getBoundingClientRect().top)
    assert.ok(offset >= 0 && offset < 60, `Reply starts ${offset}px from the visible scroll pane`)
    await page.evaluate(() => document.querySelector('.answer_body').style.removeProperty('min-height'))
    await page.locator('#mornye-appearance-toggle').click()
    await page.locator('#mornye-motion-preset').selectOption('subtle')
    await page.keyboard.press('Escape')
  })
  await page.evaluate(() => {
    document.querySelector('.process_label').textContent = '深度求索中，用时15秒'
    document.querySelector('.answer_body').setAttribute('data-streaming', 'true')
  })
  await settle()
  await check('streaming state, native elapsed time and live animation', async () => {
    assert.equal(await page.locator('#mornye-session-state').textContent(), 'RUNNING')
    assert.equal(await page.locator('#mornye-turn-elapsed').textContent(), '15秒')
    assert.notEqual(await computed('.mornye-observation__scan', 'animationName'), 'none')
  })
  await page.evaluate(() => {
    const tool = document.createElement('section'); tool.dataset.chatFlowKind='tool-call'
    tool.innerHTML='<div data-state="running">工具</div>'; document.querySelector('.chat_column').append(tool)
  })
  await settle()
  await check('tool activity uses the gold observation state', async () => {
    assert.equal(await page.locator('#mornye-session-state').textContent(), 'TOOL')
    assert.equal(await computed('.mornye-observation__scan','stroke'), 'rgb(198, 155, 72)')
  })
  await check('still mode stops all skin animations while active', async () => {
    await page.locator('#mornye-appearance-toggle').click()
    await page.locator('#mornye-motion-preset').selectOption('still')
    assert.equal(await computed('#mornye-run-state','animationName'), 'none')
    assert.equal(await computed('.mornye-observation__scan','animationName'), 'none')
    assert.equal(await computed('.mornye-observation__wave','opacity'), '0')
  })
  await page.keyboard.press('Escape')
  await page.evaluate(() => {
    document.querySelector('.answer_body').removeAttribute('data-streaming')
    document.querySelector('[data-chat-flow-kind="tool-call"]').remove()
    document.querySelector('.process_label').textContent='处理失败'
  })
  await settle()
  await check('failed turn remains visibly an error', async () => { assert.equal(await page.locator('#mornye-session-state').textContent(), 'ERROR') })
  await page.evaluate(() => {document.querySelector('.process_label').textContent='已停止'})
  await settle()
  await check('stopped turns are not marked as completed', async () => { assert.equal(await page.locator('#mornye-session-state').textContent(), 'STOPPED') })
  await page.evaluate(() => {
    const user=document.createElement('section'); user.dataset.chatFlowKind='user'; user.innerHTML='<div class="message_bubble">新的问题</div>'
    document.querySelector('.chat_column').append(user)
  })
  await settle()
  await check('old turn status does not override a new turn', async () => { assert.equal(await page.locator('#mornye-session-state').textContent(), 'READY') })
  await page.evaluate(() => { const details=document.createElement('dl'); details.setAttribute('data-session-stats-details',''); details.innerHTML='<dt>工具调用用时</dt><dd>2.5秒</dd>'; document.body.append(details) })
  await settle()
  await check('tool duration uses visible native statistics', async () => { assert.equal(await page.locator('#mornye-stat-tool-time').textContent(), '2.5秒') })
  await page.evaluate(() => document.querySelector('[data-session-stats-details]').remove())
  await settle()
  await check('unavailable tool duration is not guessed or retained', async () => { assert.equal(await page.locator('#mornye-stat-tool-time').textContent(), '—') })
  await page.evaluate(() => {
    document.querySelector('.app_frame').style.transition = 'grid-template-columns 150ms linear'
    document.querySelector('.app_frame').setAttribute('data-sidebar-collapsed','true')
  })
  await page.waitForTimeout(250)
  await check('collapsed sidebar hides the identity card', async () => { assert.equal(await page.locator('.mornye-avatar-dock').isVisible(),false) })
  await page.evaluate(() => document.querySelector('.app_frame').removeAttribute('data-sidebar-collapsed'))
  await page.waitForTimeout(250)
  await check('identity card returns after native sidebar expansion', async () => { assert.equal(await page.locator('.mornye-avatar-dock').isVisible(),true) })
  await page.evaluate(() => document.documentElement.setAttribute('data-ds-dark-theme',''))
  await settle()
  await check('HTML dark theme restores native colors as well as layout', async () => {
    assert.equal(await page.locator('#mornye-skin-layer').isVisible(), false)
    assert.equal(await page.locator('body').evaluate(el => getComputedStyle(el).getPropertyValue('--mornye-paper')), '')
    assert.equal(await computed('.input_card', 'borderRadius'), '24px')
  })
  await page.evaluate(() => window.dispose())
  await check('uninstall releases all native element decorations', async () => {
    assert.equal(await page.locator('[data-mornye-input-card], [data-mornye-chat-scroll], [data-mornye-conversation-body]').count(),0)
    assert.equal(await computed('.input_card', 'borderRadius'), '24px')
  })
  assert.deepEqual(failures, [], failures.join('\n'))
} finally { await browser.close() }
