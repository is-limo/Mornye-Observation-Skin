import { readFileSync } from 'node:fs'

const avatar = readFileSync(new URL('./assets/mornye-avatar.png', import.meta.url)).toString('base64')
const avatarUri = `data:image/png;base64,${avatar}`
const css = readFileSync(new URL('./styles/mornye.css', import.meta.url), 'utf8')
  .replaceAll('__MORNYE_AVATAR__', avatarUri)

const STYLE_ID = 'mornye-harness-skin'
const LAYER_ID = 'mornye-skin-layer'
const PANEL_ID = 'mornye-observation-panel'
const CLIENT_ID = 'mornye-layout-client'
const TOPBAR_ID = 'mornye-observation-topbar'
const APPEARANCE_ID = 'mornye-appearance-panel'
const APPEARANCE_TOGGLE_ID = 'mornye-appearance-toggle'

function insertBeforeClosingTag(html, tagName, content) {
  const expression = new RegExp(`</${tagName}>`, 'i')
  const match = expression.exec(html)
  if (match === null) return `${html}${content}`
  return `${html.slice(0, match.index)}${content}${html.slice(match.index)}`
}

export function skinMarkup() {
  return `<div id="${LAYER_ID}">
  <header id="${TOPBAR_ID}" aria-label="Mornye observation terminal">
    <div class="mornye-topbar__brand" aria-label="Mornye Observation System">
      <svg viewBox="0 0 36 44" role="presentation">
        <path class="mornye-topbar__orbit" d="M5 36A18 18 0 0 1 31 8" />
        <path class="mornye-topbar__tick" d="m29 6 4 4" />
      </svg>
      <span><b>MORNYE</b><small>OBSERVATION SYSTEM</small></span>
    </div>
    <div class="mornye-topbar__terminal">
      <span class="mornye-topbar__title">SILENT ORBIT&nbsp;&nbsp;·&nbsp;&nbsp;OBSERVATION TERMINAL</span>
      <span id="mornye-connection-state" class="mornye-topbar__status"><i></i>SYS-01&nbsp;&nbsp;·&nbsp;&nbsp;CHECKING</span>
      <span id="mornye-run-state" class="mornye-topbar__node" data-state="idle" role="status" aria-label="Idle"></span>
      <button id="${APPEARANCE_TOGGLE_ID}" type="button" aria-label="Open appearance controls" aria-controls="${APPEARANCE_ID}" aria-expanded="false">
        <svg viewBox="0 0 20 20" role="presentation">
          <path d="M3 5h14M3 10h14M3 15h14" />
          <circle cx="7" cy="5" r="1.4" />
          <circle cx="13" cy="10" r="1.4" />
          <circle cx="9" cy="15" r="1.4" />
        </svg>
      </button>
    </div>
  </header>

  <div class="mornye-avatar-dock" aria-hidden="true">
    <span class="mornye-avatar-dock__frame">
      <img src="${avatarUri}" alt="" />
      <i></i>
    </span>
    <span class="mornye-avatar-dock__copy">
      <b>MORNYE</b>
      <small id="mornye-web-state">WEB / CHECKING</small>
    </span>
    <svg class="mornye-avatar-dock__orbit" viewBox="0 0 44 44" role="presentation">
      <path class="mornye-avatar-dock__orbit-path" d="M6 37A23 23 0 0 1 36 7" />
      <path class="mornye-avatar-dock__orbit-tick" d="m34 5 4 4" />
      <rect class="mornye-avatar-dock__orbit-node" x="20" y="23" width="4" height="4" />
    </svg>
  </div>

  <section id="${APPEARANCE_ID}" aria-label="Appearance controls" data-open="false">
    <header class="mornye-appearance__header">
      <strong>APPEARANCE</strong>
      <span>LIVE PREVIEW</span>
      <button id="mornye-appearance-hide" type="button" aria-label="Hide appearance controls" title="Hide appearance controls">
        <svg viewBox="0 0 16 16" role="presentation"><path d="M3 8h10" /></svg>
      </button>
    </header>

    <label class="mornye-appearance__field" for="mornye-theme-preset">
      <span>THEME PRESET <output id="mornye-theme-value">LIGHT</output></span>
      <select id="mornye-theme-preset">
        <option value="light">LIGHT OBSERVATION TERMINAL</option>
        <option value="quiet">QUIET ORBIT</option>
        <option value="contrast">HIGH CLARITY</option>
      </select>
    </label>

    <label class="mornye-appearance__field" for="mornye-panel-opacity">
      <span>PANEL OPACITY <output id="mornye-opacity-value">86%</output></span>
      <input id="mornye-panel-opacity" type="range" min="62" max="100" value="86" />
    </label>

    <label class="mornye-appearance__field" for="mornye-motion-preset">
      <span>MOTION <output id="mornye-motion-value">SYSTEM-AWARE</output></span>
      <select id="mornye-motion-preset">
        <option value="subtle">SUBTLE ORBIT</option>
        <option value="still">STILL FRAME</option>
      </select>
    </label>

    <div class="mornye-appearance__accent" role="group" aria-label="Accent track">
      <span>ACCENT TRACK</span>
      <button type="button" data-mornye-accent="orbit" aria-label="Blue orbit accent"></button>
      <button type="button" data-mornye-accent="gold" aria-label="Gold track accent"></button>
      <button type="button" data-mornye-accent="signal" aria-label="Signal red accent"></button>
    </div>

    <footer class="mornye-appearance__actions">
      <button type="button" data-mornye-action="reset">RESET</button>
      <button type="button" data-mornye-action="apply">APPLY</button>
      <span class="mornye-appearance__done"><i></i><output id="mornye-appearance-status">SAVED</output></span>
    </footer>
  </section>

  <aside id="${PANEL_ID}" aria-label="Mornye observation panel">
    <header class="mornye-observation__header">
      <div class="mornye-observation__title">ORBITAL OBSERVATION</div>
      <div class="mornye-observation__eyebrow"><span id="mornye-turn-count">TURN —</span> / <span id="mornye-header-state">IDLE</span></div>
    </header>

    <div class="mornye-observation__stage">
      <span class="mornye-observation__coord mornye-observation__coord--left">STATE / <b id="mornye-stage-state">IDLE</b></span>
      <span class="mornye-observation__coord mornye-observation__coord--right">ELAPSED / <b id="mornye-turn-elapsed">—</b></span>
      <svg viewBox="0 0 360 360" role="presentation">
        <path class="mornye-observation__gridline" d="M180 125V235M125 180H235" />
        <g class="mornye-observation__wave" aria-hidden="true">
          <path d="M152 178V182" />
          <path d="M160 176V184" />
          <path d="M168 174V186" />
          <path d="M192 174V186" />
          <path d="M200 176V184" />
          <path d="M208 178V182" />
        </g>
        <path class="mornye-observation__track" d="M58 300A154 154 0 1 1 303 72" pathLength="100" />
        <path class="mornye-observation__scan" d="M58 300A154 154 0 1 1 303 72" pathLength="100" />
        <path class="mornye-observation__terminal" d="m296 65 14 14" />
        <rect class="mornye-observation__node" x="176" y="176" width="8" height="8" />
      </svg>
    </div>

    <div class="mornye-observation__metrics">
      <section class="mornye-observation__metric">
        <span class="mornye-observation__caption">CACHE HIT</span>
        <strong id="mornye-cache-hit">—</strong>
        <span class="mornye-observation__meter"><i id="mornye-cache-meter"></i></span>
      </section>
      <section class="mornye-observation__metric">
        <span class="mornye-observation__caption">SESSION STATE</span>
        <strong><span id="mornye-session-state">IDLE</span><i></i></strong>
      </section>
    </div>

    <section class="mornye-observation__timeline" aria-label="Conversation navigator">
      <header class="mornye-dialog-nav__header">
        <span class="mornye-observation__caption">CONVERSATION NAVIGATOR</span>
        <output id="mornye-recent-count">0 / 3 RECENT</output>
      </header>
      <ol id="mornye-activity-list" aria-label="Three most recent visible messages">
        <li data-empty="true">NO VISIBLE MESSAGES</li>
      </ol>
      <details id="mornye-history-search" class="mornye-dialog-search">
        <summary>
          <span>SEARCH LOADED CHAT</span>
          <output id="mornye-loaded-count">0 LOADED</output>
        </summary>
        <div class="mornye-dialog-search__popover">
          <label for="mornye-dialog-query">
            <span>SEARCH USER + MORNYE</span>
            <input id="mornye-dialog-query" type="search" autocomplete="off" placeholder="Type to filter loaded messages" />
          </label>
          <output id="mornye-search-count" class="mornye-dialog-search__count">NO OLDER MESSAGES</output>
          <ol id="mornye-search-results" aria-label="Loaded message search results"></ol>
        </div>
      </details>
    </section>

    <div class="mornye-observation__coordinates" aria-label="Session statistics">
      <span>TURN <b id="mornye-stat-turn">—</b></span>
      <span>STEPS <b id="mornye-stat-steps">—</b></span>
      <span>TOOL <b id="mornye-stat-tool-time">—</b></span>
    </div>
  </aside>
</div>`
}

function skinClientScript() {
  return `<script id="${CLIENT_ID}">
(() => {
  const panel = document.getElementById('${PANEL_ID}')
  const appearance = document.getElementById('${APPEARANCE_ID}')
  const appearanceToggle = document.getElementById('${APPEARANCE_TOGGLE_ID}')
  if (panel === null || appearance === null) return

  const storageKey = 'mornye.appearance.v2'
  const legacyStorageKey = 'mornye.appearance.v1'
  const defaults = { theme: 'light', opacity: 86, motion: 'subtle', accent: 'orbit', hidden: true }
  const controls = {
    theme: document.getElementById('mornye-theme-preset'),
    opacity: document.getElementById('mornye-panel-opacity'),
    motion: document.getElementById('mornye-motion-preset'),
    themeValue: document.getElementById('mornye-theme-value'),
    opacityValue: document.getElementById('mornye-opacity-value'),
    motionValue: document.getElementById('mornye-motion-value'),
    status: document.getElementById('mornye-appearance-status'),
    hide: document.getElementById('mornye-appearance-hide'),
  }
  const runtime = {
    connection: document.getElementById('mornye-connection-state'),
    web: document.getElementById('mornye-web-state'),
    node: document.getElementById('mornye-run-state'),
    turn: document.getElementById('mornye-turn-count'),
    headerState: document.getElementById('mornye-header-state'),
    stageState: document.getElementById('mornye-stage-state'),
    elapsed: document.getElementById('mornye-turn-elapsed'),
    cache: document.getElementById('mornye-cache-hit'),
    cacheMeter: document.getElementById('mornye-cache-meter'),
    sessionState: document.getElementById('mornye-session-state'),
    activities: document.getElementById('mornye-activity-list'),
    recentCount: document.getElementById('mornye-recent-count'),
    historySearch: document.getElementById('mornye-history-search'),
    loadedCount: document.getElementById('mornye-loaded-count'),
    searchInput: document.getElementById('mornye-dialog-query'),
    searchCount: document.getElementById('mornye-search-count'),
    searchResults: document.getElementById('mornye-search-results'),
    statTurn: document.getElementById('mornye-stat-turn'),
    statSteps: document.getElementById('mornye-stat-steps'),
    statToolTime: document.getElementById('mornye-stat-tool-time'),
  }

  const normalizeState = (value) => ({
    theme: ['light', 'quiet', 'contrast'].includes(value?.theme) ? value.theme : defaults.theme,
    opacity: Math.min(100, Math.max(62, Number(value?.opacity) || defaults.opacity)),
    motion: ['subtle', 'still'].includes(value?.motion) ? value.motion : defaults.motion,
    accent: ['orbit', 'gold', 'signal'].includes(value?.accent) ? value.accent : defaults.accent,
    hidden: typeof value?.hidden === 'boolean' ? value.hidden : defaults.hidden,
  })

  const readState = () => {
    try {
      const current = localStorage.getItem(storageKey)
      if (current !== null) return normalizeState(JSON.parse(current))

      const legacy = localStorage.getItem(legacyStorageKey)
      if (legacy === null) return { ...defaults }
      const migrated = normalizeState({ ...JSON.parse(legacy), hidden: true })
      localStorage.setItem(storageKey, JSON.stringify(migrated))
      return migrated
    } catch {
      return { ...defaults }
    }
  }

  let savedState = readState()
  let state = { ...savedState }

  const writeSavedState = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(savedState)) } catch {}
  }

  const appearanceDirty = () => ['theme', 'opacity', 'motion', 'accent']
    .some((key) => state[key] !== savedState[key])

  const setAppearanceStatus = (text) => {
    if (controls.status.textContent !== text) controls.status.textContent = text
    controls.status.dataset.state = text.toLowerCase()
  }

  const paintState = () => {
    document.body.dataset.mornyePreset = state.theme
    document.body.dataset.mornyeMotion = state.motion
    document.body.dataset.mornyeAccent = state.accent
    document.body.dataset.mornyePanelHidden = state.hidden ? 'true' : 'false'
    document.body.style.setProperty('--mornye-panel-alpha', String(state.opacity / 100))
    document.body.style.setProperty('--mornye-opacity-slider-stop', String(state.opacity) + '%')
    appearance.dataset.open = state.hidden ? 'false' : 'true'
    appearanceToggle?.setAttribute('aria-expanded', String(!state.hidden))
    appearanceToggle?.setAttribute('aria-label', state.hidden ? 'Open appearance controls' : 'Hide appearance controls')
    controls.theme.value = state.theme
    controls.opacity.value = String(state.opacity)
    controls.motion.value = state.motion
    controls.themeValue.textContent = state.theme === 'contrast' ? 'CLARITY' : state.theme.toUpperCase()
    controls.opacityValue.textContent = String(state.opacity) + '%'
    controls.motionValue.textContent = state.motion === 'still' ? 'STILL' : 'SYSTEM-AWARE'
    for (const button of appearance.querySelectorAll('[data-mornye-accent]')) {
      const selected = button.dataset.mornyeAccent === state.accent
      button.dataset.selected = selected ? 'true' : 'false'
      button.setAttribute('aria-pressed', String(selected))
    }
  }

  const markAppearanceDirty = () => {
    setAppearanceStatus(appearanceDirty() ? 'UNSAVED' : 'SAVED')
  }

  const persistHidden = (hidden) => {
    state = normalizeState({ ...state, hidden })
    savedState = normalizeState({ ...savedState, hidden })
    writeSavedState()
    paintState()
    markAppearanceDirty()
  }

  controls.theme.addEventListener('change', () => {
    state = normalizeState({ ...state, theme: controls.theme.value })
    paintState()
    markAppearanceDirty()
  })
  controls.opacity.addEventListener('input', () => {
    state = normalizeState({ ...state, opacity: controls.opacity.value })
    paintState()
    markAppearanceDirty()
  })
  controls.motion.addEventListener('change', () => {
    state = normalizeState({ ...state, motion: controls.motion.value })
    paintState()
    markAppearanceDirty()
  })
  for (const button of appearance.querySelectorAll('[data-mornye-accent]')) {
    button.addEventListener('click', () => {
      state = normalizeState({ ...state, accent: button.dataset.mornyeAccent })
      paintState()
      markAppearanceDirty()
    })
  }
  appearance.querySelector('[data-mornye-action="reset"]').addEventListener('click', () => {
    state = { ...defaults, hidden: state.hidden }
    savedState = { ...state }
    writeSavedState()
    paintState()
    setAppearanceStatus('RESET')
  })
  appearance.querySelector('[data-mornye-action="apply"]').addEventListener('click', () => {
    savedState = { ...state }
    writeSavedState()
    setAppearanceStatus('SAVED')
  })
  controls.hide?.addEventListener('click', () => {
    persistHidden(true)
  })
  appearanceToggle?.addEventListener('click', () => {
    const willOpen = state.hidden
    persistHidden(!state.hidden)
    if (willOpen) controls.theme.focus()
  })
  paintState()
  setAppearanceStatus('SAVED')

  let frame = 0
  let conversationSignature = ''
  let conversationEntries = []
  let focusedMessageRow = null
  let focusTimer = 0
  let messageRowSequence = 0
  const messageRowKeys = new WeakMap()
  const placeholderText = [
    '点击消息流中的工具行查看详情',
    'click a tool row to view details',
    'select a tool row to view details',
  ]

  const setText = (element, value) => {
    if (element !== null && element.textContent !== value) element.textContent = value
  }

  const setData = (element, key, value) => {
    if (element !== null && element.dataset[key] !== value) element.dataset[key] = value
  }

  const moduleClass = (moduleName, part) => {
    const suffix = '/' + moduleName + '.module.css'
    const style = [...document.querySelectorAll('style[data-plugin-css]')]
      .find((element) => (element.dataset.pluginCss || '').endsWith(suffix))
    if (style === undefined) return null
    const match = (style.textContent || '').match(new RegExp('\\\\.([A-Za-z0-9_-]+_' + part + ')\\\\{'))
    return match?.[1] || null
  }

  const firstByModuleClass = (moduleName, part, root = document) => {
    const className = moduleClass(moduleName, part)
    if (className === null) return null
    return root.getElementsByClassName(className)[0] || null
  }

  const parseStats = () => {
    const statsLine = firstByModuleClass('StatsLine', 'root')
    const text = (statsLine?.textContent || '').replace(/\\s+/g, ' ').trim()
    const counts = text.match(/(\\d+)\\s*(?:轮|turns?)\\s*·\\s*(\\d+)\\s*(?:步|steps?)/i)
    const tool = text.match(/(?:工具调用|Tool call)\\s*([^|·]+)/i)
    const cache = text.match(/(?:缓存命中|Cache hit)\\s*(\\d+(?:\\.\\d+)?)%/i)
    return {
      turns: counts === null ? null : Number(counts[1]),
      steps: counts === null ? null : Number(counts[2]),
      toolTime: tool?.[1]?.trim() || null,
      cache: cache === null ? null : Number(cache[1]),
    }
  }

  const stopButton = () => document.querySelector(
    'button[aria-label="停止生成"], button[aria-label="Stop generating"]',
  )

  const flowRows = () => [...document.querySelectorAll('[data-chat-flow-kind]')]

  const currentSessionState = () => {
    const rows = flowRows()
    const activeTool = document.querySelector(
      '[data-chat-flow-kind="tool-call"] [data-state="running"]',
    )
    if (activeTool !== null) return 'TOOL'
    if (stopButton() !== null || document.querySelector('[data-streaming="true"]') !== null) return 'RUNNING'
    const meaningful = rows.filter((row) => [
      'user', 'steering', 'assistant-step', 'tool-call', 'command', 'turn-error', 'turn-max-tokens', 'turn-tail',
    ].includes(row.dataset.chatFlowKind || ''))
    const last = meaningful.at(-1)
    if (last === undefined) return 'IDLE'
    const kind = last.dataset.chatFlowKind || ''
    if (kind === 'turn-error' || kind === 'turn-max-tokens') return 'ERROR'
    if (last.querySelector('[data-state="error"]') !== null) return 'ERROR'
    return 'DONE'
  }

  const updateRuntimeState = (stats) => {
    const sessionState = currentSessionState()
    const stateKey = sessionState.toLowerCase()
    setData(document.body, 'mornyeSessionState', stateKey)
    setData(runtime.node, 'state', stateKey)
    runtime.node?.setAttribute('aria-label', sessionState[0] + sessionState.slice(1).toLowerCase())
    setText(runtime.headerState, sessionState)
    setText(runtime.stageState, sessionState)
    setText(runtime.sessionState, sessionState)

    const turns = stats.turns === null ? '—' : String(stats.turns)
    const steps = stats.steps === null ? '—' : String(stats.steps)
    setText(runtime.turn, 'TURN ' + turns)
    setText(runtime.statTurn, turns)
    setText(runtime.statSteps, steps)
    setText(runtime.statToolTime, stats.toolTime || '—')

    const clock = firstByModuleClass('ChatView', 'turnStatusClock')
    const elapsed = sessionState === 'RUNNING' || sessionState === 'TOOL'
      ? (clock?.textContent || '').trim() || '—'
      : '—'
    setText(runtime.elapsed, elapsed)

    const cacheText = stats.cache === null ? '—' : String(stats.cache) + '%'
    setText(runtime.cache, cacheText)
    const cacheWidth = stats.cache === null ? '0%' : String(Math.min(100, Math.max(0, stats.cache))) + '%'
    if (runtime.cacheMeter !== null && runtime.cacheMeter.style.width !== cacheWidth) {
      runtime.cacheMeter.style.width = cacheWidth
    }
  }

  const messageClock = (row) => {
    const start = firstByModuleClass('MessageIconActions', 'timeStart', row)
    const end = firstByModuleClass('MessageIconActions', 'timeEnd', row)
    const text = (start?.textContent || end?.textContent || '').trim()
    return text.split('·')[0]?.trim() || '—'
  }

  const messageKey = (row) => {
    const nativeKey = row.dataset.chatAnchorKey || row.dataset.chatFlowKey
    if (nativeKey) return nativeKey
    if (!messageRowKeys.has(row)) {
      messageRowSequence += 1
      messageRowKeys.set(row, 'mornye-message-' + String(messageRowSequence))
    }
    return messageRowKeys.get(row)
  }

  const cleanMessageText = (value) => value
    .replace(/\\u200b/g, '')
    .replace(/!\\[([^\\]]*)\\]\\([^)]+\\)/g, '$1')
    .replace(/\\[([^\\]]+)\\]\\([^)]+\\)/g, '$1')
    .replace(/\\b(?:https?:\\/\\/|www\\.)[^\\s<>{}\\[\\]]+/gi, ' ')
    .replace(/^[\\s>*#+-]+/gm, '')
    .replace(/[*_~|]+/g, '')
    .replace(new RegExp(String.fromCharCode(96), 'g'), '')
    .replace(/\\s+/g, ' ')
    .trim()

  const extractMessageText = (source, excludeReasoning = false) => {
    if (!(source instanceof HTMLElement)) return ''
    const clone = source.cloneNode(true)
    const selectors = ['pre', 'script', 'style', 'button', '[aria-hidden="true"]']
    if (excludeReasoning) {
      const reasoningClass = moduleClass('ReasoningRow', 'root')
      const actionsClass = moduleClass('AssistantMarkdown', 'actions')
      if (reasoningClass !== null) selectors.push('.' + reasoningClass)
      if (actionsClass !== null) selectors.push('.' + actionsClass)
    }
    for (const element of clone.querySelectorAll(selectors.join(','))) element.remove()
    return cleanMessageText(clone.textContent || '')
  }

  const visibleMessageText = (row) => {
    const kind = row.dataset.chatFlowKind || ''
    if (kind === 'user' || kind === 'steering') {
      const bubble = firstByModuleClass('MessageItem', 'bubble', row)
        || row.querySelector('.gdEzaW_bubble')
      return extractMessageText(bubble)
    }
    if (kind === 'assistant-step') {
      const body = firstByModuleClass('AssistantMarkdown', 'body', row)
      return extractMessageText(body, true)
    }
    return ''
  }

  const summarizeMessage = (text) => {
    const sentenceEnd = text.search(/[。！？!?；;]/)
    const firstSentence = sentenceEnd === -1 ? text : text.slice(0, sentenceEnd + 1)
    const characters = Array.from(firstSentence)
    return characters.length <= 44 ? firstSentence : characters.slice(0, 43).join('') + '…'
  }

  const messageFromRow = (row) => {
    const kind = row.dataset.chatFlowKind || ''
    if (!['user', 'steering', 'assistant-step'].includes(kind)) return null
    const text = visibleMessageText(row)
    if (text === '') return null
    const isMornye = kind === 'assistant-step'
    return {
      key: messageKey(row),
      row,
      kind,
      speaker: isMornye ? 'mornye' : 'user',
      speakerLabel: isMornye ? 'MORNYE' : 'USER',
      marker: messageClock(row),
      text,
      summary: summarizeMessage(text),
    }
  }

  const focusMessage = (entry) => {
    const row = entry.row
    if (!(row instanceof HTMLElement) || !row.isConnected) {
      schedule()
      return
    }
    if (focusedMessageRow?.isConnected) {
      focusedMessageRow.removeAttribute('data-mornye-conversation-focus')
    }
    if (focusTimer !== 0) window.clearTimeout(focusTimer)
    const reducedMotion = state.motion === 'still'
      || (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    row.dataset.mornyeConversationFocus = 'true'
    row.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'center',
      inline: 'nearest',
    })
    focusedMessageRow = row
    focusTimer = window.setTimeout(() => {
      if (row.isConnected) row.removeAttribute('data-mornye-conversation-focus')
      if (focusedMessageRow === row) focusedMessageRow = null
      focusTimer = 0
    }, 2000)
  }

  const createMessageButton = (entry, className, closeSearch = false) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = className
    button.title = entry.speakerLabel + ': ' + entry.summary
    button.setAttribute(
      'aria-label',
      entry.speakerLabel + ': ' + entry.summary + ' · Locate in conversation',
    )

    const meta = document.createElement('span')
    meta.className = 'mornye-dialog-nav__meta'
    const speaker = document.createElement('b')
    speaker.textContent = entry.speakerLabel
    const marker = document.createElement('time')
    marker.textContent = entry.marker
    meta.append(speaker, marker)

    const summary = document.createElement('span')
    summary.className = 'mornye-dialog-nav__summary'
    summary.textContent = entry.summary
    button.append(meta, summary)
    button.addEventListener('click', () => {
      if (closeSearch && runtime.historySearch !== null) runtime.historySearch.open = false
      focusMessage(entry)
    })
    return button
  }

  const renderRecentMessages = () => {
    const recent = conversationEntries.slice(-3)
    setText(runtime.recentCount, String(recent.length) + ' / 3 RECENT')
    runtime.activities.replaceChildren()
    if (recent.length === 0) {
      const item = document.createElement('li')
      item.dataset.empty = 'true'
      item.textContent = 'NO VISIBLE MESSAGES'
      runtime.activities.append(item)
      return
    }
    for (const entry of recent) {
      const item = document.createElement('li')
      item.dataset.kind = entry.kind
      item.dataset.speaker = entry.speaker
      item.append(createMessageButton(entry, 'mornye-dialog-nav__message'))
      runtime.activities.append(item)
    }
  }

  const renderSearchResults = () => {
    if (runtime.searchResults === null) return
    const query = cleanMessageText(runtime.searchInput?.value || '').toLocaleLowerCase()
    const recentKeys = new Set(conversationEntries.slice(-3).map((entry) => entry.key))
    const candidates = query === ''
      ? conversationEntries.filter((entry) => !recentKeys.has(entry.key))
      : conversationEntries.filter((entry) => (
        entry.text.toLocaleLowerCase().includes(query)
        || entry.speakerLabel.toLocaleLowerCase().includes(query)
      ))
    const results = candidates.slice().reverse().slice(0, 20)
    const emptyLabel = query === '' ? 'NO OLDER MESSAGES' : 'NO MATCHES'
    setText(
      runtime.searchCount,
      candidates.length === 0
        ? emptyLabel
        : 'SHOWING ' + String(results.length) + ' OF ' + String(candidates.length),
    )
    runtime.searchResults.replaceChildren()
    if (results.length === 0) {
      const item = document.createElement('li')
      item.dataset.empty = 'true'
      item.textContent = emptyLabel
      runtime.searchResults.append(item)
      return
    }
    for (const entry of results) {
      const item = document.createElement('li')
      item.dataset.speaker = entry.speaker
      item.append(createMessageButton(entry, 'mornye-dialog-search__result', true))
      runtime.searchResults.append(item)
    }
  }

  const updateConversationNavigator = () => {
    const entries = flowRows()
      .map(messageFromRow)
      .filter((entry) => entry !== null)
    const signature = JSON.stringify(entries.map((entry) => [
      entry.key, entry.marker, entry.speaker, entry.summary, entry.text,
    ]))
    const rowsChanged = entries.some((entry, index) => entry.row !== conversationEntries[index]?.row)
    const changed = signature !== conversationSignature || rowsChanged
    conversationEntries = entries
    setText(runtime.loadedCount, String(entries.length) + ' LOADED')
    if (!changed) return
    conversationSignature = signature
    renderRecentMessages()
    renderSearchResults()
  }

  runtime.searchInput?.addEventListener('input', renderSearchResults)
  runtime.searchInput?.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || runtime.historySearch === null) return
    runtime.historySearch.open = false
    runtime.historySearch.querySelector('summary')?.focus()
  })
  runtime.historySearch?.addEventListener('toggle', () => {
    if (!runtime.historySearch.open) return
    renderSearchResults()
    requestAnimationFrame(() => runtime.searchInput?.focus())
  })
  document.addEventListener('pointerdown', (event) => {
    if (runtime.historySearch?.open && !runtime.historySearch.contains(event.target)) {
      runtime.historySearch.open = false
    }
  })

  const nativeDetailsAreActive = (details) => {
    const nativeChildren = [...details.children].filter((element) => element !== panel)
    if (nativeChildren.length === 0) return false
    const text = nativeChildren.map((element) => element.innerText || '').join(' ').replace(/\\s+/g, ' ').trim().toLowerCase()
    if (text === '' || text === '详情' || text === 'details') return false
    return !placeholderText.some((placeholder) => text.includes(placeholder))
  }

  const mount = () => {
    frame = 0
    const viewTabs = [...document.querySelectorAll('.wSkVaW_tabs [role="tab"]')]
    const conversationSelected = viewTabs.length < 2 || viewTabs[0]?.getAttribute('aria-selected') === 'true'
    setData(document.body, 'mornyeView', conversationSelected ? 'conversation' : 'alternate')
    const details = document.querySelector('.pI_x6G_detailsCol')
    if (details === null) {
      setData(document.body, 'mornyeLayout', 'waiting')
      return
    }
    if (panel.parentElement !== details) details.append(panel)
    setData(details, 'mornyeNativeDetails', nativeDetailsAreActive(details) ? 'active' : 'idle')
    setData(document.body, 'mornyeLayout', 'mounted')
    const stats = parseStats()
    updateRuntimeState(stats)
    updateConversationNavigator()
  }
  const schedule = () => {
    if (frame !== 0) return
    frame = requestAnimationFrame(mount)
  }

  const observer = new MutationObserver(schedule)
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['aria-selected', 'aria-label', 'data-state', 'data-streaming', 'data-phase'],
  })
  window.addEventListener('resize', schedule, { passive: true })

  let connectionFailures = 0
  const paintConnection = (connection) => {
    setData(document.body, 'mornyeConnection', connection)
    const label = connection.toUpperCase()
    setText(runtime.connection, 'SYS-01  ·  ' + label)
    setText(runtime.web, 'WEB / ' + label)
  }

  const checkConnection = async () => {
    if (navigator.onLine === false) {
      connectionFailures = 3
      paintConnection('offline')
      return
    }
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 3000)
    try {
      const response = await fetch(new URL('/', window.location.href), {
        cache: 'no-store',
        credentials: 'same-origin',
        signal: controller.signal,
      })
      response.body?.cancel()
      connectionFailures = 0
      paintConnection('connected')
    } catch {
      connectionFailures += 1
      paintConnection(connectionFailures >= 3 ? 'offline' : 'reconnecting')
    } finally {
      window.clearTimeout(timeout)
    }
  }

  window.addEventListener('offline', () => {
    connectionFailures = 3
    paintConnection('offline')
  })
  window.addEventListener('online', () => {
    connectionFailures = 0
    paintConnection('reconnecting')
    checkConnection()
  })
  paintConnection('reconnecting')
  checkConnection()
  window.setInterval(checkConnection, 5000)
  schedule()
})()
</script>`
}

export function injectMornyeSkin(html) {
  if (html.includes(`id="${STYLE_ID}"`) || html.includes(`id="${LAYER_ID}"`)) return html

  const withStyle = insertBeforeClosingTag(html, 'head', `<style id="${STYLE_ID}">\n${css}\n</style>`)
  return insertBeforeClosingTag(withStyle, 'body', `${skinMarkup()}\n${skinClientScript()}`)
}

export function apply(ctx) {
  ctx.inject(['webServer'], (httpCtx) => {
    httpCtx.effect(
      () => httpCtx.webServer.tapIndex(injectMornyeSkin),
      'mornye-harness-skin: adapt rc.6 observation workbench layout',
    )
  })
}
