/** Browser-only adapter. Its complete lifecycle is owned by the DSH plugin. */
export function startMornyeDesktop({ css, markup }) {
  if (document.getElementById('mornye-desktop-style')) return () => {}
  const style = document.createElement('style')
  style.id = 'mornye-desktop-style'
  style.textContent = css
  document.head.append(style)
  const template = document.createElement('template')
  template.innerHTML = markup // Build-time, first-party static markup only.
  const layer = template.content.firstElementChild
  document.body.append(layer)
  const byId = id => layer.querySelector('#' + id)
  const panel = byId('mornye-observation-panel')
  const appearance = byId('mornye-appearance-panel')
  const toggle = byId('mornye-appearance-toggle')
  const abort = new AbortController()
  const listen = (target, event, callback) => target.addEventListener(event, callback, { signal: abort.signal })
  const storageKey = 'mornye.desktop.appearance.v1'
  const defaults = { theme: 'light', opacity: 86, motion: 'subtle', accent: 'orbit' }
  const sanitize = value => ({
    theme: ['light', 'quiet', 'contrast'].includes(value?.theme) ? value.theme : defaults.theme,
    opacity: Number.isFinite(value?.opacity) ? Math.min(100, Math.max(62, value.opacity)) : defaults.opacity,
    motion: value?.motion === 'still' ? 'still' : 'subtle',
    accent: ['orbit', 'gold', 'signal'].includes(value?.accent) ? value.accent : defaults.accent,
  })
  let preferences = { ...defaults }
  try { preferences = sanitize(JSON.parse(localStorage.getItem(storageKey))) } catch {}
  let open = false
  let frame = 0
  let timer = 0
  let disposed = false
  let entries = []
  let signature = ''
  let searchSignature = ''
  let focusedRow = null
  let watchedSidebar = null
  const tagged = new Map()
  const classes = new Map()
  const text = (id, value) => { const node = byId(id); if (node && node.textContent !== value) node.textContent = value }
  const data = (node, key, value) => { if (node && node.dataset[key] !== value) node.dataset[key] = value }
  const mark = (node, key) => {
    if (!node || node.hasAttribute(key)) return
    node.setAttribute(key, '')
    if (!tagged.has(node)) tagged.set(node, new Set())
    tagged.get(node).add(key)
  }
  // Resolve CSS module exports from their documented style tags, not build hashes.
  const moduleClass = (name, part) => {
    const key = name + '/' + part
    if (classes.has(key)) return classes.get(key)
    const tag = document.querySelector('style[data-plugin-css$="/' + name + '.module.css"]')
    // Native class names may begin with an escaped digit (e.g. message clocks).
    const selectors = tag?.textContent.replace(/\\([0-9a-f]{1,6})\s?|\\(.)/gi, (_, hex, char) =>
      hex ? String.fromCodePoint(Math.min(parseInt(hex, 16), 0x10ffff)) : char)
    const match = selectors?.match(new RegExp('\\.([\\w-]+_' + part + ')(?=[\\s{.:\\[>,#])'))
    if (match) classes.set(key, match[1])
    return match?.[1]
  }
  const find = (name, part, root = document) => {
    const cls = moduleClass(name, part)
    return cls ? root.getElementsByClassName(cls)[0] : null
  }
  const visible = node => Boolean(node && !node.closest('[hidden], [aria-hidden="true"]') &&
    node.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }))
  const markAll = (name, part, attribute, root = document) => {
    const cls = moduleClass(name, part)
    if (cls) for (const node of root.getElementsByClassName(cls)) mark(node, attribute)
  }
  const setAppearanceOpen = value => {
    open = value
    data(appearance, 'open', String(open))
    toggle.setAttribute('aria-expanded', String(open))
    toggle.setAttribute('aria-label', open ? '关闭外观设置' : '打开外观设置')
  }
  const paintPreferences = () => {
    data(document.body, 'mornyePreset', preferences.theme)
    data(document.body, 'mornyeAccent', preferences.accent)
    data(document.body, 'mornyeMotion', preferences.motion)
    document.body.style.setProperty('--mornye-panel-alpha', String(preferences.opacity / 100))
    document.body.style.setProperty('--mornye-opacity-slider-stop', preferences.opacity + '%')
    byId('mornye-theme-preset').value = preferences.theme
    byId('mornye-motion-preset').value = preferences.motion
    byId('mornye-panel-opacity').value = String(preferences.opacity)
    text('mornye-theme-value', preferences.theme.toUpperCase())
    text('mornye-opacity-value', preferences.opacity + '%')
    text('mornye-motion-value', preferences.motion === 'still' ? 'STILL' : 'SYSTEM-AWARE')
    for (const button of appearance.querySelectorAll('[data-mornye-accent]')) {
      button.setAttribute('aria-pressed', String(button.dataset.mornyeAccent === preferences.accent))
    }
  }
  const save = () => {
    paintPreferences()
    try { localStorage.setItem(storageKey, JSON.stringify(preferences)); text('mornye-appearance-status', 'SAVED') }
    catch { text('mornye-appearance-status', 'THIS WINDOW ONLY') }
  }
  listen(toggle, 'click', () => setAppearanceOpen(!open))
  listen(byId('mornye-appearance-hide'), 'click', () => { setAppearanceOpen(false); toggle.focus() })
  listen(byId('mornye-theme-preset'), 'change', event => { preferences.theme = event.target.value; save() })
  listen(byId('mornye-motion-preset'), 'change', event => { preferences.motion = event.target.value; save() })
  listen(byId('mornye-panel-opacity'), 'input', event => { preferences.opacity = Number(event.target.value); save() })
  for (const button of appearance.querySelectorAll('[data-mornye-accent]')) {
    listen(button, 'click', () => { preferences.accent = button.dataset.mornyeAccent; save() })
  }
  listen(appearance.querySelector('[data-mornye-action="reset"]'), 'click', () => { preferences = { ...defaults }; save() })
  listen(appearance.querySelector('[data-mornye-action="apply"]'), 'click', () => { save(); setAppearanceOpen(false); toggle.focus() })
  const history = byId('mornye-history-search')
  const query = byId('mornye-dialog-query')
  listen(document, 'keydown', event => {
    if (event.key !== 'Escape') return
    if (history.open) { history.open = false; history.querySelector('summary').focus() }
    else if (open) { setAppearanceOpen(false); toggle.focus() }
  })
  listen(document, 'pointerdown', event => {
    if (open && !appearance.contains(event.target) && !toggle.contains(event.target)) setAppearanceOpen(false)
    if (history.open && !history.contains(event.target)) history.open = false
  })
  const reducedMotion = () => preferences.motion === 'still' || matchMedia('(prefers-reduced-motion: reduce)').matches
  const locate = entry => {
    if (!entry.row.isConnected) { schedule(); return }
    focusedRow?.removeAttribute('data-mornye-conversation-focus')
    clearTimeout(timer)
    focusedRow = entry.row
    focusedRow.dataset.mornyeConversationFocus = 'true'
    focusedRow.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start', inline: 'nearest' })
    timer = setTimeout(() => { focusedRow?.removeAttribute('data-mornye-conversation-focus'); focusedRow = null }, 2000)
  }
  const summary = value => { const chars = Array.from(value); return chars.length > 62 ? chars.slice(0, 61).join('') + '…' : value }
  const messageButton = entry => {
    const li = document.createElement('li')
    li.dataset.speaker = entry.speaker === 'MORNYE' ? 'mornye' : 'user'
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'mornye-dialog-nav__button'
    button.title = '定位消息 · ' + summary(entry.text)
    const meta = document.createElement('span')
    meta.className = 'mornye-dialog-nav__meta'
    const who = document.createElement('b')
    who.textContent = entry.speaker
    const count = document.createElement('time')
    count.textContent = entry.time || '—'
    meta.append(who, count)
    const copy = document.createElement('span')
    copy.className = 'mornye-dialog-nav__summary'
    copy.textContent = summary(entry.text)
    button.append(meta, copy)
    button.addEventListener('click', () => { history.open = false; locate(entry) })
    li.append(button)
    return li
  }
  const renderSearch = () => {
    const needle = query.value.trim().toLocaleLowerCase()
    const results = needle ? entries.filter(entry => entry.text.toLocaleLowerCase().includes(needle)) : entries.slice(0, -3)
    const next = needle + ':' + results.map(entry => entry.index + ':' + entry.text).join('|')
    if (searchSignature === next) return
    searchSignature = next
    byId('mornye-search-results').replaceChildren(...results.slice(-80).reverse().map(messageButton))
    text('mornye-search-count', results.length + (results.length > 80 ? ' MATCHES · LAST 80' : ' MATCHES'))
    if (!results.length) {
      const empty = document.createElement('li')
      empty.dataset.empty = 'true'
      empty.textContent = needle ? '没有匹配的已加载正文' : '没有更早的已加载消息'
      byId('mornye-search-results').append(empty)
    }
  }
  listen(query, 'input', renderSearch)
  listen(history, 'toggle', () => { if (history.open) { renderSearch(); query.focus() } })
  const readVisibleMessages = () => {
    const rows = [...document.querySelectorAll('[data-chat-flow-kind]')].filter(row =>
      ['user', 'steering', 'assistant-step'].includes(row.dataset.chatFlowKind) && visible(row))
    return rows.flatMap((row, index) => {
      const assistant = row.dataset.chatFlowKind === 'assistant-step'
      const source = assistant ? find('AssistantMarkdown', 'body', row) : find('MessageItem', 'bubble', row)
      if (!visible(source)) return []
      const selectors = ['pre', 'script', 'style', 'button', '[aria-hidden="true"]', '[hidden]']
      for (const [name, part] of [['ReasoningRow', 'root'], ['AssistantMarkdown', 'actions']]) {
        const cls = moduleClass(name, part); if (cls) selectors.push('.' + cls)
      }
      const excluded = selectors.join(',')
      const read = node => {
        if (node.nodeType === Node.TEXT_NODE) return node.textContent
        if (!(node instanceof Element) || node.matches(excluded)) return ''
        const computed = getComputedStyle(node)
        if (computed.display === 'none' || computed.visibility !== 'visible' || computed.opacity === '0') return ''
        const children = node.matches('details:not([open])') ? [node.querySelector('summary')].filter(Boolean) : [...node.childNodes]
        const value = children.map(read).join('')
        return computed.display === 'inline' ? value : ' ' + value + ' '
      }
      // Index rendered text only; never surface URL parameters in summaries/search.
      const value = read(source).replace(/\b(?:https?:\/\/|www\.)[^\s<>{}\[\]]+/gi, ' ').replace(/\s+/g, ' ').trim()
      const clock = find('MessageIconActions', 'timeStart', row) || find('MessageIconActions', 'timeEnd', row)
      const time = visible(clock) ? clock.textContent.trim().split('·')[0].trim() : ''
      return value ? [{ row, index, text: value, time, speaker: assistant ? 'MORNYE' : 'YOU' }] : []
    })
  }
  const readSessionState = chat => {
    if (!chat || !visible(chat)) return { state: 'IDLE', elapsed: '—' }
    const rows = [...chat.querySelectorAll('[data-chat-flow-kind]')].filter(visible)
    // Historical errors must not override the current turn.
    const lastUser = rows.findLastIndex(row => row.dataset.chatFlowKind === 'user')
    const turn = rows.slice(Math.max(0, lastUser))
    const process = turn.findLast(row => row.dataset.chatFlowKind === 'turn-process')
    const label = process ? find('TurnProcessNodeView', 'label', process)?.textContent.trim() || '' : ''
    const stop = [...document.querySelectorAll('button[aria-label="停止生成"],button[aria-label="Stop generating"]')].some(visible)
    const tool = turn.some(row => row.dataset.chatFlowKind === 'tool-call' && [...row.querySelectorAll('[data-state="running"]')].some(visible))
    const streaming = turn.some(row => [...row.querySelectorAll('[data-streaming="true"]')].some(visible))
    const running = tool || stop || streaming || /^(?:深度求索中|Deep diving)/i.test(label)
    const failed = turn.some(row => ['turn-error', 'turn-max-tokens'].includes(row.dataset.chatFlowKind)) || /^(?:处理失败|Failed)$/i.test(label)
    const stopped = /^(?:已停止|Stopped)$/i.test(label)
    const done = /^(?:用时|已完成工作|Took\b|Worked\b)/i.test(label) || turn.some(row => row.dataset.chatFlowKind === 'turn-tail')
    const state = tool ? 'TOOL' : running ? 'RUNNING' : failed ? 'ERROR' : stopped ? 'STOPPED' : done ? 'DONE' : entries.length ? 'READY' : 'IDLE'
    const elapsed = running ? label.match(/(?:用时|Deep diving for\s+)(.+)$/i)?.[1]?.trim() || '—' : '—'
    return { state, elapsed }
  }
  const syncSidebar = () => {
    if (disposed) return
    const sideWidth = watchedSidebar?.getBoundingClientRect().width || 0
    layer.style.setProperty('--mornye-sidebar-width', sideWidth + 'px')
    data(layer, 'sidebarCollapsed', String(sideWidth < 120))
  }
  const refresh = () => {
    frame = 0
    if (disposed) return
    for (const [node, keys] of tagged) if (!node.isConnected) {
      for (const key of keys) node.removeAttribute(key)
      tagged.delete(node)
    }
    const shell = find('AppFrame', 'frame')
    const center = find('AppFrame', 'centerCol')
    const sidebar = find('AppFrame', 'sidebarCol')
    const chat = find('ChatView', 'root')
    mark(shell, 'data-mornye-frame'); mark(center, 'data-mornye-center'); mark(sidebar, 'data-mornye-sidebar')
    mark(find('SidebarRoot', 'regionArea'), 'data-mornye-sidebar-region')
    for (const [name, part, attribute] of [
      ['SidebarRoot', 'root', 'data-mornye-sidebar-root'], ['SidebarRoot', 'newSession', 'data-mornye-new-session'],
      ['ConversationRoot', 'body', 'data-mornye-conversation-body'], ['ConversationRoot', 'header', 'data-mornye-chat-header'],
      ['ConversationRoot', 'tabs', 'data-mornye-chat-tabs'], ['ChatView', 'scroll', 'data-mornye-chat-scroll'],
      ['ChatView', 'column', 'data-mornye-chat-column'], ['MessageItem', 'bubble', 'data-mornye-bubble'],
      ['InputBar', 'root', 'data-mornye-input-root'], ['InputBar', 'card', 'data-mornye-input-card'], ['InputBar', 'primary', 'data-mornye-input-primary'],
    ]) markAll(name, part, attribute)
    const dark = document.body.hasAttribute('data-ds-dark-theme') || document.documentElement.hasAttribute('data-ds-dark-theme')
    const conversation = Boolean(chat && chat.getClientRects().length)
    const nativePanel = shell && !shell.hasAttribute('data-rightbar-collapsed')
    data(document.body, 'mornyeDesktop', dark ? 'dark' : shell ? 'ready' : 'waiting')
    data(document.body, 'mornyeRail', String(!dark && conversation && !nativePanel && innerWidth >= 1180))
    if (sidebar !== watchedSidebar) {
      if (watchedSidebar) sidebarObserver.unobserve(watchedSidebar)
      watchedSidebar = sidebar
      if (watchedSidebar) sidebarObserver.observe(watchedSidebar)
    }
    syncSidebar()
    const newEntries = readVisibleMessages()
    const changed = entries.length !== newEntries.length || newEntries.some((entry, i) => entry.row !== entries[i]?.row)
    entries = newEntries
    const next = entries.map(entry => entry.speaker + ':' + entry.time + ':' + entry.text).join('\n')
    if (changed || next !== signature) {
      signature = next
      const recent = entries.slice(-3).reverse().map(messageButton)
      if (!recent.length) { const empty = document.createElement('li'); empty.dataset.empty = 'true'; empty.textContent = '等待新的观测 · NO MESSAGES'; recent.push(empty) }
      byId('mornye-activity-list').replaceChildren(...recent)
      searchSignature = ''
      renderSearch()
    }
    text('mornye-recent-count', Math.min(entries.length, 3) + ' / 3 RECENT')
    text('mornye-loaded-count', entries.length + ' LOADED')
    const { state, elapsed } = readSessionState(chat)
    data(document.body, 'mornyeSessionState', state.toLowerCase())
    data(byId('mornye-run-state'), 'state', state.toLowerCase())
    byId('mornye-run-state').setAttribute('aria-label', state)
    for (const id of ['mornye-header-state', 'mornye-stage-state', 'mornye-session-state']) text(id, state)
    // This describes the local renderer, never internet/model/provider availability.
    text('mornye-connection-state', 'DESKTOP  ·  LOCAL')
    text('mornye-web-state', 'DESKTOP / LOCAL')
    text('mornye-turn-count', 'VISIBLE ' + entries.length)
    const stats = document.querySelector('[data-composer-stats]')?.textContent || find('StatsPills', 'root')?.textContent || ''
    const counts = stats.match(/(\d+)\s*(?:轮|turns?)\s*(?:[·&]\s*)?(\d+)\s*(?:步|steps?)/i)
    const cache = stats.match(/(?:缓存命中|Cache hit)\s*(\d+(?:\.\d+)?)%/i)
    text('mornye-cache-hit', cache ? cache[1] + '%' : '—')
    byId('mornye-cache-meter').style.width = cache ? Math.min(100, Number(cache[1])) + '%' : '0%'
    text('mornye-stat-turn', counts?.[1] || '—')
    text('mornye-stat-steps', counts?.[2] || '—')
    const toolLabel = [...document.querySelectorAll('[data-session-stats-details] dt')].find(node =>
      visible(node) && /^(?:工具调用用时|Tool time)$/i.test(node.textContent.trim()))
    const toolValue = toolLabel?.nextElementSibling
    text('mornye-stat-tool-time', toolValue?.tagName === 'DD' && visible(toolValue) ? toolValue.textContent.trim() : '—')
    text('mornye-turn-elapsed', elapsed)
    panel.setAttribute('aria-label', '莫宁观测面板 · 仅反映当前页面可见状态')
  }
  const schedule = () => { if (!disposed && !frame) frame = requestAnimationFrame(refresh) }
  const sidebarObserver = new ResizeObserver(syncSidebar)
  const observer = new MutationObserver(records => {
    if (records.some(record => !layer.contains(record.target) && record.target !== style)) schedule()
  })
  observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true,
    attributeFilter: ['data-rightbar-collapsed', 'data-sidebar-collapsed', 'data-ds-dark-theme', 'aria-label', 'aria-selected', 'data-chat-flow-kind', 'data-streaming', 'data-state', 'hidden', 'aria-hidden', 'open', 'class', 'style'] })
  listen(window, 'resize', schedule)
  paintPreferences()
  setAppearanceOpen(false)
  refresh()
  return () => {
    disposed = true
    observer.disconnect(); sidebarObserver.disconnect(); watchedSidebar = null
    abort.abort(); cancelAnimationFrame(frame); clearTimeout(timer)
    focusedRow?.removeAttribute('data-mornye-conversation-focus')
    for (const [node, keys] of tagged) for (const key of keys) node.removeAttribute(key)
    for (const key of ['mornyeDesktop', 'mornyeRail', 'mornyePreset', 'mornyeAccent', 'mornyeMotion', 'mornyeSessionState']) delete document.body.dataset[key]
    for (const key of ['--mornye-panel-alpha', '--mornye-opacity-slider-stop']) document.body.style.removeProperty(key)
    layer.remove(); style.remove(); entries = []; classes.clear(); tagged.clear()
  }
}
