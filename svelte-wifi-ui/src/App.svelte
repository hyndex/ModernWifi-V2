<script>
  import { onDestroy, onMount } from 'svelte'

  const navItems = [
    { id: 'dashboard', label: 'Status', icon: 'dashboard' },
    { id: 'wifi', label: 'Networks', icon: 'wifi' },
    { id: 'config', label: 'System', icon: 'settings' }
  ]

  const iconPaths = {
    dashboard:
      'M4 5h7v7H4zM13 5h7v4h-7zM13 11h7v7h-7zM4 13h7v5H4z',
    wifi: 'M2.5 9a15 15 0 0 1 19 0l-1.7 1.9a12 12 0 0 0-15.6 0zm3.3 3.6a10 10 0 0 1 12.4 0l-1.7 1.9a7.3 7.3 0 0 0-9 0zm3.4 3.5a5 5 0 0 1 5.6 0L12 18.9z',
    settings:
      'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm8.4 3.5c0-.5 0-1-.1-1.5l2-1.6-1.9-3.2-2.3.8a7.8 7.8 0 0 0-2.5-1.5l-.4-2.4H8.8l-.4 2.4a7.8 7.8 0 0 0-2.5 1.5l-2.3-.8L1.7 9l2 1.5a8.7 8.7 0 0 0 0 3L1.7 15l1.9 3.2 2.3-.8a7.8 7.8 0 0 0 2.5 1.5l.4 2.4h4.2l.4-2.4a7.8 7.8 0 0 0 2.5-1.5l2.3.8 1.9-3.2-2-1.5c.1-.5.1-1 .1-1.5Z',
    power: 'M12 2v9m-5.7-5A7 7 0 1 0 17.7 6'
  }

  const defaultNetworks = [
    { ssid: 'JouleNet', strength: 82, secure: true, channel: 6, latency: 18 },
    { ssid: 'Lab-Guest', strength: 58, secure: true, channel: 11, latency: 32 },
    { ssid: 'OpenCafe', strength: 36, secure: false, channel: 1, latency: 48 },
    { ssid: 'FieldNode', strength: 71, secure: true, channel: 3, latency: 22 }
  ]

  const API_TIMEOUT = 6000
  const MIN_REFRESH = 5000
  const MAX_REFRESH = 120000
  const DEFAULT_REFRESH = 15000
  const DEFAULT_RETRIES = 2
  const MAX_LOGS = 7
  const STORAGE_KEYS = {
    interval: 'wm_sync_interval',
    retries: 'wm_retry_limit'
  }

  let loading = true
  let activated = false
  let view = 'dashboard'
  let toast = ''
  let toastVisible = false
  let toastTimer
  let apiAvailable = false
  let loadingStatus = false
  let loadingNetworks = false
  let connecting = false
  let savingConfig = false
  let autoRefresh = true
  let refreshTimer
  let refreshIntervalMs = DEFAULT_REFRESH
  let refreshIntervalSeconds = Math.round(DEFAULT_REFRESH / 1000)
  let retryLimit = DEFAULT_RETRIES
  let syncing = false
  let syncError = ''
  let lastSync = null

  let device = {
    name: 'ESP32-S3 PRO',
    fw: '1.2.4',
    ip: '192.168.4.1',
    ap: 'ESP32_SETUP',
    uptime: 'n/a',
    lastSeen: 'just now',
    connectedSsid: '',
    hostname: 'esp32-s3-pro',
    apClients: 0
  }

  let wifiNetworks = defaultNetworks.map((n) => ({ ...n }))
  let selectedNetwork = wifiNetworks[0] || null
  let wifiPassword = ''
  let logs = []

  let config = {
    hostname: 'esp32-s3-pro',
    timezone: 'UTC',
    portalTimeout: 300,
    captive: true,
    apSsid: 'ESP32_SETUP',
    apPassword: 'configureme'
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  $: healthState = !apiAvailable
    ? 'offline cache'
    : device.connectedSsid
    ? 'online'
    : 'portal only'

  $: bestNetwork = wifiNetworks[0] || null

  onMount(() => {
    const stored = localStorage.getItem('esp32_activated')
    if (stored === 'true') {
      activated = true
    }
    const cachedSsid = localStorage.getItem('esp32_selected_ssid')
    if (cachedSsid) {
      const found = wifiNetworks.find((n) => n.ssid === cachedSsid)
      if (found) {
        selectedNetwork = found
        device.connectedSsid = found.ssid
      }
    }
    loadSyncPrefs()
    addLog('Portal bootstrapped', 'info')
    const init = async () => {
      if (activated) {
        await refreshAll()
        if (autoRefresh) {
          startAutoRefresh()
        }
      }
      loading = false
    }
    init().catch(() => {
      syncError = 'Initial sync failed'
      loading = false
      addLog('Initial sync failed - using cached data', 'warn')
    })
  })

  onDestroy(() => {
    stopAutoRefresh()
    clearTimeout(toastTimer)
  })

  const addLog = (message, tone = 'info') => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      message,
      tone,
      time: new Date()
    }
    logs = [entry, ...logs].slice(0, MAX_LOGS)
  }

  const formatTime = (date) => {
    if (!date) return 'never'
    return new Intl.DateTimeFormat('en', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date)
  }

  const fetchJSON = async (path, options = {}, attempt = 1) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT)
    try {
      const res = await fetch(path, { ...options, signal: controller.signal })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      return await res.json()
    } catch (err) {
      if (attempt < retryLimit) {
        await wait(260 * attempt)
        return fetchJSON(path, options, attempt + 1)
      }
      throw err
    } finally {
      clearTimeout(timer)
    }
  }

  const setView = (id) => {
    view = id
  }

  const showToast = (message) => {
    toast = message
    toastVisible = true
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      toastVisible = false
    }, 2600)
  }

  const startAutoRefresh = () => {
    stopAutoRefresh()
    refreshTimer = setInterval(() => refreshAll(false, true), refreshIntervalMs)
  }

  const stopAutoRefresh = () => {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }

  const toggleAutoRefresh = (nextValue) => {
    const desired = typeof nextValue === 'boolean' ? nextValue : !autoRefresh
    autoRefresh = desired
    if (desired) {
      startAutoRefresh()
      addLog('Live sync enabled', 'success')
      showToast('Live sync enabled')
    } else {
      stopAutoRefresh()
      addLog('Live sync paused', 'warn')
      showToast('Live sync paused')
    }
  }

  const loadSyncPrefs = () => {
    const storedInterval = Number(localStorage.getItem(STORAGE_KEYS.interval))
    if (!Number.isNaN(storedInterval) && storedInterval >= MIN_REFRESH && storedInterval <= MAX_REFRESH) {
      refreshIntervalMs = storedInterval
      refreshIntervalSeconds = Math.round(storedInterval / 1000)
    }
    const storedRetries = Number(localStorage.getItem(STORAGE_KEYS.retries))
    if (!Number.isNaN(storedRetries) && storedRetries >= 1 && storedRetries <= 5) {
      retryLimit = storedRetries
    }
  }

  const saveSyncPrefs = () => {
    const clampedInterval = Math.min(MAX_REFRESH, Math.max(MIN_REFRESH, refreshIntervalSeconds * 1000))
    refreshIntervalMs = clampedInterval
    refreshIntervalSeconds = Math.round(clampedInterval / 1000)
    retryLimit = Math.min(5, Math.max(1, Math.round(retryLimit)))
    localStorage.setItem(STORAGE_KEYS.interval, String(refreshIntervalMs))
    localStorage.setItem(STORAGE_KEYS.retries, String(retryLimit))
    if (autoRefresh) {
      startAutoRefresh()
    }
    addLog('Sync cadence updated', 'info')
    showToast('Sync cadence saved')
  }

  const activate = () => {
    activated = true
    localStorage.setItem('esp32_activated', 'true')
    addLog('Device activated. Portal unlocked.', 'success')
    showToast('Device activated. Portal unlocked.')
    refreshAll()
    if (autoRefresh) {
      startAutoRefresh()
    }
  }

  const logout = () => {
    activated = false
    view = 'dashboard'
    stopAutoRefresh()
    localStorage.removeItem('esp32_activated')
    localStorage.removeItem('esp32_selected_ssid')
    addLog('Portal session cleared', 'warn')
    showToast('Portal session cleared.')
  }

  const selectNetwork = (network) => {
    selectedNetwork = network
    wifiPassword = ''
  }

  const signalBars = (strength) => Math.min(4, Math.max(1, Math.round((strength || 0) / 25)))

  const parseNetworks = (items = []) =>
    items.map((n) => ({
      ssid: n.ssid ?? 'unknown',
      strength: Number(n.strength ?? 0),
      secure: n.secure !== false,
      channel: n.channel ?? 0,
      latency: n.latency ?? 0
    }))

  const pickDefaultNetwork = () => {
    if (selectedNetwork && wifiNetworks.find((n) => n.ssid === selectedNetwork.ssid)) return
    selectedNetwork = wifiNetworks[0] || null
  }

  const loadStatus = async ({ notify = true } = {}) => {
    loadingStatus = true
    try {
      const data = await fetchJSON('/api/status')
      apiAvailable = true
      const lastSeenState = data.connected ? 'online' : data.portalActive ? 'portal' : 'offline'
      device = {
        ...device,
        fw: data.fw || device.fw,
        ip: data.ip || device.ip,
        ap: data.ap || device.ap,
        connectedSsid: data.connected ? data.ssid : '',
        lastSeen: lastSeenState,
        hostname: data.hostname || device.hostname,
        apClients: data.apClients ?? device.apClients,
        uptime: data.uptime || device.uptime
      }
      return true
    } catch (err) {
      apiAvailable = false
      if (notify) {
        showToast('Status offline, using cached values')
      }
      return false
    } finally {
      loadingStatus = false
    }
  }

  const loadConfig = async ({ notify = true } = {}) => {
    try {
      const data = await fetchJSON('/api/config')
      apiAvailable = true
      config.hostname = data.hostname || config.hostname
      config.portalTimeout = Number(data.portalTimeout ?? config.portalTimeout)
      config.captive = data.captive ?? config.captive
      config.apSsid = data.apSsid || config.apSsid
      if (data.apPasswordSet === false) {
        config.apPassword = ''
      }
      return true
    } catch (err) {
      if (notify) {
        showToast('Config offline, keeping cached settings')
      }
      return false
    }
  }

  const loadNetworks = async (force = false, { notify = true } = {}) => {
    loadingNetworks = true
    try {
      const data = await fetchJSON(force ? '/api/scan?refresh=1' : '/api/scan')
      wifiNetworks = parseNetworks(Array.isArray(data) ? data : [])
      apiAvailable = true
      pickDefaultNetwork()
      return true
    } catch (err) {
      wifiNetworks = defaultNetworks.map((n) => ({ ...n }))
      pickDefaultNetwork()
      if (notify) {
        showToast('Scan failed, using cached list')
      }
      return false
    } finally {
      loadingNetworks = false
    }
  }

  const refreshAll = async (force = false, silent = false) => {
    if (syncing) return
    syncing = true
    syncError = ''
    try {
      const [statusOk, networksOk, configOk] = await Promise.all([
        loadStatus({ notify: !silent }),
        loadNetworks(force, { notify: !silent }),
        loadConfig({ notify: !silent })
      ])
      const success = statusOk || networksOk || configOk
      apiAvailable = success
      if (success) {
        lastSync = new Date()
        if (!silent) {
          addLog(force ? 'Forced sync completed' : 'Synced with device', 'success')
        }
      } else {
        syncError = 'Could not reach device'
        if (!silent) {
          showToast('Sync failed, using cached values')
        }
        addLog('Sync failed; using cached values', 'warn')
      }
    } catch (err) {
      syncError = err?.message || 'Sync error'
      apiAvailable = false
      addLog(`Sync error: ${syncError}`, 'error')
      if (!silent) {
        showToast('Sync error')
      }
    } finally {
      syncing = false
    }
  }

  const connectSelected = async () => {
    if (!selectedNetwork) return
    if (selectedNetwork.secure && wifiPassword.length < 8) {
      showToast('Password must be at least 8 characters.')
      return
    }
    connecting = true
    try {
      const payload = new URLSearchParams({
        ssid: selectedNetwork.ssid,
        password: selectedNetwork.secure ? wifiPassword : ''
      })
      const data = await fetchJSON('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload
      })
      if (data.connected) {
        device.connectedSsid = selectedNetwork.ssid
        localStorage.setItem('esp32_selected_ssid', selectedNetwork.ssid)
        addLog(`Connected to ${selectedNetwork.ssid}`, 'success')
        showToast(`Connected to ${selectedNetwork.ssid}`)
      } else {
        addLog('Connection failed', 'warn')
        showToast(data.status ? `Failed: ${data.status}` : 'Connection failed')
      }
    } catch (err) {
      addLog('Connect failed', 'error')
      showToast('Connect failed')
    } finally {
      connecting = false
    }
  }

  const rescan = () => {
    loadNetworks(true, { notify: true })
  }

  const saveConfig = async (event) => {
    event.preventDefault()
    savingConfig = true
    const data = new FormData(event.currentTarget)
    const payload = new URLSearchParams({
      hostname: data.get('hostname') || '',
      timezone: data.get('timezone') || '',
      portalTimeout: data.get('portalTimeout') || '',
      captive: data.get('captive') ? 'true' : 'false',
      apSsid: data.get('apSsid') || '',
      apPassword: data.get('apPassword') || ''
    })
    try {
      await fetchJSON('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload
      })
      config.hostname = data.get('hostname') || config.hostname
      config.timezone = data.get('timezone') || config.timezone
      config.portalTimeout = Number(data.get('portalTimeout') || config.portalTimeout)
      config.captive = !!data.get('captive')
      config.apSsid = data.get('apSsid') || config.apSsid
      config.apPassword = data.get('apPassword') || config.apPassword
      lastSync = new Date()
      addLog('Settings saved', 'success')
      showToast('Settings saved')
    } catch (err) {
      addLog('Save failed', 'error')
      showToast('Save failed')
    } finally {
      savingConfig = false
    }
  }
</script>

{#if loading}
  <div class="screen fill">
    <div class="spinner"></div>
    <div class="mono">syncing with device...</div>
  </div>
{:else if !activated}
  <div class="screen fill">
    <div class="card activation">
      <div class="eyebrow">ESP32 Onboarding</div>
      <h1>WiFi Manager Portal</h1>
      <p>Securely activate the device to open the control surface.</p>
      <div class="activation-row">
        <div class="pill">AP: {device.ap}</div>
        <div class="pill subtle">Gateway: {device.ip}</div>
      </div>
      <div class="activation-actions">
        <button class="primary" on:click={activate}>Activate</button>
        <button class="ghost" on:click={() => showToast('Use the AP to reach 192.168.4.1')}>
          How to connect
        </button>
      </div>
    </div>
  </div>
{:else}
  <div class="frame">
    <div class="aurora"></div>
    <header class="topbar">
      <div class="identity">
        <div class="badge">JP</div>
        <div>
          <div class="eyebrow">ESP32 Portal</div>
          <div class="title">{device.name}</div>
          <div class="chip-row">
            <span class="pill subtle">FW {device.fw}</span>
            <span class="pill subtle">AP {device.ap}</span>
          </div>
        </div>
      </div>
      <div class="top-actions">
        <div class="pill mini {apiAvailable ? '' : 'warn'}">{healthState}</div>
        <div class="pill subtle">Last sync {formatTime(lastSync)}</div>
        <button class="ghost" on:click={() => refreshAll(true)} disabled={syncing}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 4h6v2H7.4a7 7 0 1 1-.5 9.6l1.6-1.2A5 5 0 1 0 7.3 8H10V4H4zm16 16h-6v-2h2.6a7 7 0 0 1-11.6-7l1.6 1.2A5 5 0 0 0 17 16h-2v4h5z"></path>
          </svg>
          {syncing ? 'Syncing' : 'Sync now'}
        </button>
        <label class="toggle" class:active={autoRefresh}>
          <input
            type="checkbox"
            bind:checked={autoRefresh}
            on:change={() => toggleAutoRefresh(autoRefresh)}
          />
          <span>{autoRefresh ? 'Live async refresh' : 'Manual sync'}</span>
        </label>
        <button class="ghost" on:click={logout}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d={iconPaths.power}></path></svg>
          Logout
        </button>
      </div>
    </header>

    <section class="rail">
      <div class="rail-card">
        <div class="eyebrow">Reliability</div>
        <div class="lead">
          {device.connectedSsid ? 'Connected' : 'Not connected'}
          <span class="pill mini">{healthState}</span>
        </div>
        <p class="muted">
          {syncError
            ? syncError
            : apiAvailable
            ? 'Link is stable. Async refresh keeps telemetry warm.'
            : 'Working from cached values until the device responds.'}
        </p>
        <div class="meta">
          <span class="pill">IP {device.ip}</span>
          <span class="pill subtle">Uptime {device.uptime}</span>
          <span class="pill subtle">AP clients {device.apClients}</span>
        </div>
      </div>
      <div class="rail-card">
        <div class="eyebrow">Live sync</div>
        <div class="lead">{autoRefresh ? 'Async auto refresh' : 'Manual control'}</div>
        <div class="row stats-row">
          <div>
            <div class="muted small">API</div>
            <div class="stat-text">{apiAvailable ? 'Reachable' : 'Offline'}</div>
          </div>
          <div>
            <div class="muted small">Last sync</div>
            <div class="stat-text">{formatTime(lastSync)}</div>
          </div>
          <div>
            <div class="muted small">Mode</div>
            <div class="stat-text">{autoRefresh ? 'Async' : 'On demand'}</div>
          </div>
        </div>
        <div class="sync-controls">
          <label class="mini-field">
            <span>Interval (s)</span>
            <input
              type="number"
              min="5"
              max="120"
              bind:value={refreshIntervalSeconds}
              on:change={saveSyncPrefs}
            />
          </label>
          <label class="mini-field">
            <span>Retries</span>
            <input type="number" min="1" max="5" bind:value={retryLimit} on:change={saveSyncPrefs} />
          </label>
        </div>
        <div class="muted small">
          Aborts at {API_TIMEOUT / 1000}s, retries {Math.max(retryLimit - 1, 0)}x with backoff.
        </div>
        <div class="actions-row">
          <button class="pill buttonish" on:click={() => refreshAll()} disabled={syncing}>
            {syncing ? 'Refreshing...' : 'Refresh now'}
          </button>
          <button class="pill buttonish ghosty" on:click={rescan} disabled={loadingNetworks}>
            {loadingNetworks ? 'Scanning...' : 'Rescan networks'}
          </button>
        </div>
      </div>
      <div class="rail-card activity">
        <div class="eyebrow">Recent activity</div>
        <ul class="log-list">
          {#if !logs.length}
            <li class="muted small">Waiting for events...</li>
          {:else}
            {#each logs as entry}
              <li class={entry.tone}>
                <span class="dot tiny"></span>
                <div>
                  <div class="log-msg">{entry.message}</div>
                  <div class="muted small">{formatTime(entry.time)}</div>
                </div>
              </li>
            {/each}
          {/if}
        </ul>
      </div>
    </section>

    <nav class="nav">
      {#each navItems as item}
        <button class:active={view === item.id} on:click={() => setView(item.id)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d={iconPaths[item.icon]}></path></svg>
          {item.label}
        </button>
      {/each}
    </nav>

    <main>
      {#if view === 'dashboard'}
        <section class="grid">
          <div class="card highlight">
            <div class="eyebrow">Connection</div>
            <div class="lead">{device.connectedSsid ? 'Online' : 'Not connected'}</div>
            <p class="muted">
              {device.connectedSsid
                ? `Linked to ${device.connectedSsid}`
                : 'Join a network to unlock cloud features.'}
            </p>
            <div class="meta">
              <span class="pill">IP {device.ip}</span>
              <span class="pill subtle">Uptime {device.uptime}</span>
            </div>
            <div class="actions-row">
              <button class="primary ghosty" on:click={() => setView('wifi')}>Manage Wi-Fi</button>
              <button class="ghost" on:click={() => refreshAll(true)} disabled={syncing}>
                {syncing ? 'Syncing...' : 'Force sync'}
              </button>
            </div>
          </div>

          <div class="card compact">
            <div class="eyebrow">Device</div>
            <div class="stack">
              <div class="row">
                <span class="muted">Portal</span>
                <span class="pill subtle">{device.ap}</span>
              </div>
              <div class="row">
                <span class="muted">Firmware</span>
                <span class="pill">v{device.fw}</span>
              </div>
              <div class="row">
                <span class="muted">Hostname</span>
                <span class="pill subtle">{config.hostname}</span>
              </div>
              <div class="row">
                <span class="muted">AP clients</span>
                <span class="pill subtle">{device.apClients}</span>
              </div>
              <div class="row">
                <span class="muted">AP mode</span>
                <span class="pill subtle">{device.ap}</span>
              </div>
            </div>
          </div>

          <div class="card compact">
            <div class="eyebrow">Shortcuts</div>
            <div class="actions-row">
              <button class="pill buttonish" on:click={() => setView('wifi')}>Networks</button>
              <button class="pill buttonish" on:click={() => setView('config')}>System</button>
              <button class="pill buttonish ghosty" on:click={() => showToast('Logs pulled')}>
                Download logs
              </button>
            </div>
            <div class="actions-row">
              <button class="pill buttonish" on:click={rescan} disabled={loadingNetworks}>
                {loadingNetworks ? 'Scanning...' : 'Rescan'}
              </button>
              <button class="pill buttonish ghosty" on:click={() => showToast('Diagnostics queued')}>
                Diagnostics
              </button>
            </div>
          </div>

          <div class="card compact">
            <div class="eyebrow">Best nearby</div>
            {#if bestNetwork}
              <div class="lead">{bestNetwork.ssid}</div>
              <div class="row subtle">
                <span>{bestNetwork.secure ? 'Secured' : 'Open AP'}</span>
                <span>Signal {bestNetwork.strength}%</span>
              </div>
              <div class="row subtle">
                <span>Channel {bestNetwork.channel}</span>
                <span>{bestNetwork.latency} ms</span>
              </div>
              <button class="ghost" on:click={() => setView('wifi')}>View networks</button>
            {:else}
              <p class="muted">No scans yet.</p>
            {/if}
          </div>

          <div class="card compact activity">
            <div class="eyebrow">Activity</div>
            <ul class="log-list">
              {#if !logs.length}
                <li class="muted small">No activity yet.</li>
              {:else}
                {#each logs as entry}
                  <li class={entry.tone}>
                    <span class="dot tiny"></span>
                    <div>
                      <div class="log-msg">{entry.message}</div>
                      <div class="muted small">{formatTime(entry.time)}</div>
                    </div>
                  </li>
                {/each}
              {/if}
            </ul>
          </div>
        </section>
      {:else if view === 'wifi'}
        <section class="wifi">
          <div class="card header-card">
            <div class="left">
              <div class="eyebrow">Networks</div>
              <div class="lead">Scan nearby Wi-Fi</div>
              <p class="muted">
                Sync is {autoRefresh ? 'async and live' : 'manual'} so you can rescan anytime without blocking.
              </p>
            </div>
            <div class="right">
              <button class="ghost" on:click={rescan} disabled={loadingNetworks}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 4h6v2H7.4a7 7 0 1 1-.5 9.6l1.6-1.2A5 5 0 1 0 7.3 8H10V4H4zm16 16h-6v-2h2.6a7 7 0 0 1-11.6-7l1.6 1.2A5 5 0 0 0 17 16h-2v4h5z"></path>
                </svg>
                {loadingNetworks ? 'Scanning...' : 'Rescan'}
              </button>
            </div>
          </div>

          <div class="wifi-grid">
            <div class="card list">
              {#if loadingNetworks}
                <div class="loading-block">
                  <div class="spinner small"></div>
                  <span class="muted">Scanning...</span>
                </div>
              {:else if !wifiNetworks.length}
                <div class="muted">No networks found</div>
              {:else}
                {#each wifiNetworks as net}
                  <button
                    class="network"
                    class:active={selectedNetwork?.ssid === net.ssid}
                    on:click={() => selectNetwork(net)}
                  >
                    <div>
                      <div class="row">
                        <strong>{net.ssid}</strong>
                        <span class="pill" class:open={!net.secure}>{net.secure ? 'Secured' : 'Open'}</span>
                      </div>
                      <div class="row subtle">
                        <span>Channel {net.channel}</span>
                        <span>{net.latency} ms</span>
                      </div>
                    </div>
                    <div class="signal">
                      {#each [1, 2, 3, 4] as bar}
                        <span class:active={signalBars(net.strength) >= bar}></span>
                      {/each}
                    </div>
                  </button>
                {/each}
              {/if}
            </div>

            <div class="card detail">
              <div class="eyebrow">Selected</div>
              {#if loadingNetworks}
                <p class="muted">Waiting for scan results...</p>
              {:else if selectedNetwork}
                <div class="lead">{selectedNetwork.ssid}</div>
                <div class="row subtle">
                  <span>{selectedNetwork.secure ? 'WPA2/WPA3' : 'Open AP'}</span>
                  <span>Signal {selectedNetwork.strength}%</span>
                </div>
                {#if selectedNetwork.secure}
                  <label class="field">
                    <span>Password</span>
                    <input
                      name="password"
                      type="password"
                      placeholder="8+ characters"
                      bind:value={wifiPassword}
                      minlength="8"
                    />
                  </label>
                {/if}
                <button class="primary" on:click={connectSelected} disabled={connecting || loadingNetworks}>
                  {connecting ? 'Connecting...' : 'Connect'}
                </button>
              {:else}
                <p class="muted">Choose a network to configure.</p>
              {/if}
            </div>
          </div>
        </section>
      {:else}
        <section class="card form">
          <div class="eyebrow">System</div>
          <div class="lead">Portal and device settings</div>
          <p class="muted">
            Keep the captive portal responsive with async refresh, or switch to manual sync when debugging.
          </p>
          <form class="grid form-grid" on:submit|preventDefault={saveConfig}>
            <label class="field">
              <span>Hostname</span>
              <input name="hostname" bind:value={config.hostname} />
            </label>
            <label class="field">
              <span>Timezone</span>
              <input name="timezone" bind:value={config.timezone} />
            </label>
            <label class="field">
              <span>Portal timeout (s)</span>
              <input name="portalTimeout" type="number" min="30" step="30" bind:value={config.portalTimeout} />
            </label>
            <label class="field checkbox">
              <input name="captive" type="checkbox" bind:checked={config.captive} />
              <span>Enable captive portal redirect</span>
            </label>
            <label class="field">
              <span>AP SSID</span>
              <input name="apSsid" bind:value={config.apSsid} />
            </label>
            <label class="field">
              <span>AP Password</span>
              <input name="apPassword" type="password" bind:value={config.apPassword} minlength="8" />
            </label>
            <div class="form-actions">
              <button class="ghost" type="button" on:click={() => showToast('Reboot queued')}>Reboot</button>
              <button class="primary" type="submit" disabled={savingConfig}>
                {savingConfig ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </section>
      {/if}
    </main>
  </div>
{/if}

{#if toastVisible}
  <div class="toast">{toast}</div>
{/if}
