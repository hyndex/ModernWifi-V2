<script>
  import { onMount } from 'svelte'

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

  let device = {
    name: 'ESP32-S3 PRO',
    fw: '1.2.4',
    ip: '192.168.4.1',
    ap: 'ESP32_SETUP',
    uptime: '12h 14m',
    lastSeen: 'just now',
    connectedSsid: '',
    hostname: 'esp32-s3-pro',
    apClients: 0
  }

  let wifiNetworks = defaultNetworks.map((n) => ({ ...n }))
  let selectedNetwork = wifiNetworks[0] || null
  let wifiPassword = ''

  let config = {
    hostname: 'esp32-s3-pro',
    timezone: 'UTC',
    portalTimeout: 300,
    captive: true,
    apSsid: 'ESP32_SETUP',
    apPassword: 'configureme'
  }

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
    const init = async () => {
      if (activated) {
        await refreshAll()
      }
      loading = false
    }
    init().catch(() => {
      loading = false
    })
  })

  const fetchJSON = async (path, options = {}) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT)
    try {
      const res = await fetch(path, { ...options, signal: controller.signal })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      return await res.json()
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

  const activate = () => {
    activated = true
    localStorage.setItem('esp32_activated', 'true')
    showToast('Device activated. Portal unlocked.')
    refreshAll()
  }

  const logout = () => {
    activated = false
    view = 'dashboard'
    localStorage.removeItem('esp32_activated')
    localStorage.removeItem('esp32_selected_ssid')
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

  const loadStatus = async () => {
    loadingStatus = true
    try {
      const data = await fetchJSON('/api/status')
      apiAvailable = true
      device = {
        ...device,
        fw: data.fw || device.fw,
        ip: data.ip || device.ip,
        ap: data.ap || device.ap,
        connectedSsid: data.connected ? data.ssid : '',
        lastSeen: data.connected ? 'online' : 'offline',
        hostname: data.hostname || device.hostname,
        apClients: data.apClients ?? device.apClients
      }
    } catch (err) {
      apiAvailable = false
      showToast('Status offline, using cached values')
    } finally {
      loadingStatus = false
    }
  }

  const loadConfig = async () => {
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
    } catch (err) {
      // keep existing config, silent fallback
    }
  }

  const loadNetworks = async (force = false) => {
    loadingNetworks = true
    try {
      const data = await fetchJSON(force ? '/api/scan?refresh=1' : '/api/scan')
      wifiNetworks = parseNetworks(Array.isArray(data) ? data : [])
      apiAvailable = true
      pickDefaultNetwork()
    } catch (err) {
      apiAvailable = false
      wifiNetworks = defaultNetworks.map((n) => ({ ...n }))
      pickDefaultNetwork()
      showToast('Scan failed, using cached list')
    } finally {
      loadingNetworks = false
    }
  }

  const refreshAll = async (force = false) => {
    await Promise.all([loadStatus(), loadNetworks(force), loadConfig()])
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
        showToast(`Connected to ${selectedNetwork.ssid}`)
      } else {
        showToast(data.status ? `Failed: ${data.status}` : 'Connection failed')
      }
    } catch (err) {
      showToast('Connect failed')
    } finally {
      connecting = false
    }
  }

  const rescan = () => {
    loadNetworks(true)
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
      showToast('Settings saved')
    } catch (err) {
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
        <button class="ghost" on:click={() => showToast('Use the AP to reach 192.168.4.1')}>How to connect</button>
      </div>
    </div>
  </div>
{:else}
  <div class="frame">
    <header class="topbar">
      <div class="identity">
        <span class="dot online"></span>
        <div>
          <div class="eyebrow">ESP32 Portal</div>
          <div class="title">{device.name}</div>
        </div>
      </div>
      <div class="top-actions">
        <span class="pill subtle">FW {device.fw}</span>
        <span class="pill">AP {device.ap}</span>
        <span class="pill {apiAvailable ? '' : 'warn'}">{apiAvailable ? 'API live' : 'API offline'}</span>
        <button class="ghost" on:click={logout}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d={iconPaths.power}></path></svg>
          Logout
        </button>
      </div>
    </header>

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
          <div class="card">
            <div class="eyebrow">Connection</div>
            <div class="lead">{device.connectedSsid ? 'Online' : 'Not connected'}</div>
            <p class="muted">
              {device.connectedSsid ? `Linked to ${device.connectedSsid}` : 'Join a network to unlock cloud features.'}
            </p>
            <div class="meta">
              <span class="pill">IP {device.ip}</span>
              <span class="pill subtle">Uptime {device.uptime}</span>
            </div>
            <button class="primary ghosty" on:click={() => setView('wifi')}>Manage Wi‑Fi</button>
          </div>

          <div class="card">
            <div class="eyebrow">Last seen</div>
            <div class="lead">{device.lastSeen}</div>
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
            </div>
          </div>

          <div class="card">
            <div class="eyebrow">Shortcuts</div>
            <div class="actions-row">
              <button class="pill buttonish" on:click={() => setView('wifi')}>Networks</button>
              <button class="pill buttonish" on:click={() => setView('config')}>System</button>
              <button class="pill buttonish ghosty" on:click={() => showToast('Logs pulled')}>Download Logs</button>
            </div>
          </div>
        </section>
      {:else if view === 'wifi'}
        <section class="wifi">
          <div class="card header-card">
            <div class="left">
              <div class="eyebrow">Networks</div>
              <div class="lead">Scan nearby Wi‑Fi</div>
            </div>
            <div class="right">
              <button class="ghost" on:click={rescan} disabled={loadingNetworks}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v2H7.4a7 7 0 1 1-.5 9.6l1.6-1.2A5 5 0 1 0 7.3 8H10V4H4zm16 16h-6v-2h2.6a7 7 0 0 1-11.6-7l1.6 1.2A5 5 0 0 0 17 16h-2v4h5z"></path></svg>
                Rescan
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
                  <button class="network" class:active={selectedNetwork?.ssid === net.ssid} on:click={() => selectNetwork(net)}>
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
          <div class="lead">Portal & device settings</div>
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
              <button class="primary" type="submit" disabled={savingConfig}>{savingConfig ? 'Saving...' : 'Save'}</button>
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
