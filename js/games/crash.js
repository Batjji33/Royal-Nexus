let crashState = 'idle'; // idle | running | cashed_out | crashed
let crashMultiplier = 1.00;
let crashPoint = 1.00;
let crashBet = 10;
let crashTick = 0;
let crashInterval = null;
let minCrashBet = 10;

function generateCrashPoint() {
  const r = Math.random();
  
  // 10% de chance de crash instantané à 1.00 (standard de l'industrie, peu frustrant)
  if (r < 0.10) return 1.00;
  
  // 25% de chance de crash précoce (entre 1.01 et 1.30)
  if (r < 0.35) {
    return Math.max(1.01, Math.round((1.01 + Math.random() * 0.29) * 100) / 100);
  }
  
  // 53% de chance de crash moyen (entre 1.31 et 2.50) -> permet de jolis cashouts
  if (r < 0.88) {
    return Math.max(1.31, Math.round((1.31 + Math.random() * 1.19) * 100) / 100);
  }
  
  // 12% restants : au-dessus de 2.50 avec un plafond absolu et strict à x7.50
  const r2 = Math.random();
  const val = 2.50 + Math.pow(r2, 3) * 5.00;
  return Math.max(2.50, Math.round(val * 100) / 100);
}

async function renderCrash() {
  const settings = await getSettings();
  minCrashBet = parseInt(settings.crash_min_bet || '10');
  crashBet = minCrashBet;
  crashState = 'idle';
  crashMultiplier = 1.00;

  render(`
  ${renderNavbar()}
  <!-- Hero image -->
  <div style="height:260px;background-image:linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.85)),url('Gemini_Generated_Image_ts3qjzts3qjzts3q.png');
    background-size:cover;background-position:center;display:flex;flex-direction:column;align-items:center;justify-content:center;">
    <h1 style="font-family:'Cinzel';color:#fff;font-size:36px;letter-spacing:3px;">Crash</h1>
    <p style="font-family:'Cormorant Garamond';color:var(--text-secondary);font-size:18px;margin-top:8px;font-style:italic;">Cash out avant le crash ou perdez tout</p>
  </div>

  <div style="max-width:1100px;margin:0 auto;padding:32px 24px;">
    <a href="#/lobby" style="color:var(--text-muted);font-family:'Jost';font-size:13px;text-decoration:none;">← Retour au Lobby</a>
    
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;margin-top:24px;" id="crash-layout">
      
      <!-- GAUCHE : Graphique Premium Radar Tactique -->
      <div class="card" id="crash-radar-card" style="display:flex;flex-direction:column;position:relative;min-height:400px;background:#030703;border-color:rgba(74,222,128,0.25);overflow:hidden;box-shadow:inset 0 0 40px rgba(74,222,128,0.05);background-image:radial-gradient(rgba(74,222,128,0.1) 1px, transparent 1px);background-size:24px 24px;transition:transform 0.05s ease;">
        <div style="position:absolute;inset:0;background:linear-gradient(180deg, transparent 60%, rgba(74,222,128,0.03) 100%);pointer-events:none;"></div>
        
        <svg id="crash-svg" viewBox="0 0 500 300" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;" preserveAspectRatio="none">
          <defs>
            <!-- Gradient de la courbe neon -->
            <linearGradient id="curve-glow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#22c55e" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="#4ade80" stop-opacity="1"/>
            </linearGradient>
            <!-- Gradient rouge en cas de crash -->
            <linearGradient id="curve-glow-crashed" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ef4444" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="#f87171" stop-opacity="1"/>
            </linearGradient>
            <!-- Gradient de l'aire sous la courbe -->
            <linearGradient id="area-glow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#4ade80" stop-opacity="0.2"/>
              <stop offset="100%" stop-color="#22c55e" stop-opacity="0.0"/>
            </linearGradient>
            <linearGradient id="area-glow-crashed" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#f87171" stop-opacity="0.2"/>
              <stop offset="100%" stop-color="#ef4444" stop-opacity="0.0"/>
            </linearGradient>
          </defs>
          
          <!-- L'aire sous la courbe -->
          <polygon id="crash-area" points="0,300 0,300" fill="url(#area-glow)" />
          
          <!-- La ligne principale néon -->
          <polyline id="crash-line" points="0,300" fill="none" stroke="url(#curve-glow)" stroke-width="4.5" stroke-linecap="round" style="filter: drop-shadow(0 0 8px rgba(74,222,128,0.5));"/>
          
          <!-- Le point ou la fusée de tête -->
          <g id="crash-rocket-node" transform="translate(0, 300)" style="transition: transform 0.08s linear;">
            <circle r="8" fill="#fff" style="filter: drop-shadow(0 0 8px #4ade80);" />
            <circle r="4" fill="#4ade80" id="crash-rocket-core" />
            <text id="crash-rocket-emoji" x="-9" y="7" font-size="16">🚀</text>
          </g>
        </svg>
        
        <div style="margin:auto;text-align:center;z-index:10;pointer-events:none;">
          <div id="crash-mult-display" style="font-family:'Cormorant Garamond';font-size:84px;font-weight:800;color:#4ade80;text-shadow:0 0 25px rgba(74,222,128,0.4);letter-spacing:1px;transition:transform 0.05s ease;">
            ×1.00
          </div>
          <div id="crash-status-msg" style="font-family:'Jost';color:var(--text-secondary);font-size:16px;margin-top:16px;height:24px;font-weight:500;">
            Prêt
          </div>
        </div>
      </div>

      <!-- DROITE : Contrôles -->
      <div class="card" id="crash-controls-wrapper">
        <div id="crash-controls">
          ${renderCrashControls()}
        </div>
        <div style="margin-top:24px;border-top:1px solid rgba(255,255,255,0.1);padding-top:24px;">
          <label style="font-family:'Jost';color:var(--text-secondary);font-size:14px;display:block;margin-bottom:8px;">Auto Cash Out à × (optionnel)</label>
          <input type="number" id="auto-cashout-input" placeholder="ex: 2.5" step="0.1" min="1.01" style="width:100%;padding:12px;background:rgba(0,0,0,0.3);border:1px solid rgba(201,168,76,0.3);border-radius:6px;color:#fff;font-family:'Jost';font-size:16px;">
        </div>
      </div>
    </div>
  </div>`);
  
  updateCrashUI();
}

function renderCrashControls() {
  if (crashState === 'idle') {
    return `
      <h3 style="font-family:'Cinzel';color:var(--gold-primary);font-size:18px;margin-bottom:20px;">Nouvelle partie</h3>
      <p style="font-family:'Cormorant Garamond';color:var(--gold-primary);font-size:16px;margin-bottom:16px;">
        Vous dépensez <strong id="crash-cost-display">${crashBet}</strong> coins pour jouer.
      </p>
      
      <div style="display:flex;gap:8px;margin-bottom:24px;">
        <button onclick="setCrashBet(${minCrashBet})" class="btn-outline-gold" style="flex:1;padding:8px;font-size:13px;">Min</button>
        <button onclick="setCrashBet(${minCrashBet * 2})" class="btn-outline-gold" style="flex:1;padding:8px;font-size:13px;">×2</button>
        <button onclick="setCrashBet(${minCrashBet * 4})" class="btn-outline-gold" style="flex:1;padding:8px;font-size:13px;">×4</button>
        <button onclick="setCrashBet(${minCrashBet * 10})" class="btn-outline-gold" style="flex:1;padding:8px;font-size:13px;">×10</button>
      </div>

      <button onclick="startCrash()" class="btn-gold" style="width:100%;padding:16px;font-size:16px;letter-spacing:1px;">
        DÉMARRER
      </button>
    `;
  } else if (crashState === 'running') {
    const currentWin = Math.floor(crashBet * crashMultiplier);
    return `
      <div style="text-align:center;padding:20px 0;">
        <p style="font-family:'Jost';color:var(--text-secondary);font-size:14px;margin-bottom:8px;">Gain actuel</p>
        <p style="font-family:'Cormorant Garamond';color:#4ade80;font-size:32px;font-weight:700;margin-bottom:24px;">
          <span id="crash-live-win">${currentWin}</span> coins
        </p>
        <button onclick="cashOutCrash()" class="btn-success" id="crash-cashout-btn" style="width:100%;padding:20px;font-size:20px;font-weight:700;letter-spacing:1px;box-shadow:0 0 20px rgba(45,122,58,0.5);">
          CASH OUT ×<span id="crash-live-mult">${crashMultiplier.toFixed(2)}</span>
        </button>
      </div>
    `;
  } else {
    return `
      <div style="text-align:center;padding:20px 0;">
        <button onclick="resetCrash()" class="btn-gold" style="width:100%;padding:16px;font-size:16px;letter-spacing:1px;">
          REJOUER
        </button>
      </div>
    `;
  }
}

function setCrashBet(val) {
  crashBet = val;
  const el = document.getElementById('crash-cost-display');
  if (el) el.textContent = crashBet;
}

function updateCrashUI() {
  const multEl = document.getElementById('crash-mult-display');
  const msgEl = document.getElementById('crash-status-msg');
  const controlsEl = document.getElementById('crash-controls');
  const line = document.getElementById('crash-line');
  
  if (controlsEl) {
    const liveWinEl = document.getElementById('crash-live-win');
    if (crashState !== 'running' || !liveWinEl) {
      controlsEl.innerHTML = renderCrashControls();
    } else {
      const currentWin = Math.floor(crashBet * crashMultiplier);
      const liveWin = document.getElementById('crash-live-win');
      const liveMult = document.getElementById('crash-live-mult');
      if (liveWin) liveWin.textContent = currentWin;
      if (liveMult) liveMult.textContent = crashMultiplier.toFixed(2);
    }
  }

  const autoInput = document.getElementById('auto-cashout-input');
  if (autoInput) {
    autoInput.disabled = (crashState === 'running');
    autoInput.style.opacity = (crashState === 'running') ? '0.5' : '1';
  }

  if (multEl) {
    multEl.textContent = `×${crashMultiplier.toFixed(2)}`;
    if (crashState === 'running') {
      multEl.style.color = '#4ade80';
      multEl.style.textShadow = '0 0 20px rgba(74,222,128,0.4)';
    } else if (crashState === 'cashed_out') {
      multEl.style.color = 'var(--gold-primary)';
      multEl.style.textShadow = '0 0 20px rgba(201,168,76,0.4)';
    } else if (crashState === 'crashed') {
      multEl.style.color = '#f87171';
      multEl.style.textShadow = '0 0 20px rgba(248,113,113,0.4)';
    }
  }

  if (msgEl) {
    if (crashState === 'cashed_out') {
      const net = Math.floor(crashBet * crashMultiplier) - crashBet;
      msgEl.innerHTML = `<span style="color:var(--gold-primary);">✅ Cash out ! Gain net: +${net} coins</span>`;
    } else if (crashState === 'crashed') {
      msgEl.innerHTML = `<span style="color:#f87171;">💥 Crash à ×${crashPoint.toFixed(2)}</span>`;
    } else {
      msgEl.innerHTML = '';
    }
  }
  
  if (line && crashState === 'running') {
    const limitX = Math.max(80, crashTick);
    const limitY = Math.max(2.5, crashMultiplier);
    
    let polylinePoints = [];
    let polygonPoints = ["0,300"];
    
    for (let i = 0; i <= crashTick; i++) {
      const mult = Math.round(Math.pow(1.03, i) * 100) / 100;
      const px = (i / limitX) * 460;
      const py = 280 - ((mult - 1) / (limitY - 1)) * 240;
      polylinePoints.push(`${px},${py}`);
      polygonPoints.push(`${px},${py}`);
    }
    
    const lastX = (crashTick / limitX) * 460;
    const lastY = 280 - ((crashMultiplier - 1) / (limitY - 1)) * 240;
    
    line.setAttribute('stroke', 'url(#curve-glow)');
    line.setAttribute('points', polylinePoints.join(' '));
    
    polygonPoints.push(`${lastX},300`);
    const area = document.getElementById('crash-area');
    if (area) {
      area.setAttribute('fill', 'url(#area-glow)');
      area.setAttribute('points', polygonPoints.join(' '));
    }
    
    const rocket = document.getElementById('crash-rocket-node');
    if (rocket) {
      rocket.setAttribute('transform', `translate(${lastX}, ${lastY})`);
    }
    
    // Effet de tremblement suspense (tremble plus fort si le multiplicateur grimpe)
    const card = document.getElementById('crash-radar-card');
    if (card) {
      if (crashMultiplier > 2.5) {
        card.style.transform = `translate(${(Math.random()-0.5)*4.5}px, ${(Math.random()-0.5)*4.5}px)`;
      } else if (crashMultiplier > 1.4) {
        card.style.transform = `translate(${(Math.random()-0.5)*2}px, ${(Math.random()-0.5)*2}px)`;
      } else {
        card.style.transform = 'none';
      }
    }
    
    // Zoom dynamique de la valeur
    const multDisplay = document.getElementById('crash-mult-display');
    if (multDisplay) {
      const pulseScale = 1 + (crashMultiplier - 1) * 0.025;
      multDisplay.style.transform = `scale(${Math.min(1.22, pulseScale)})`;
    }
    
  } else if (line && crashState === 'crashed') {
    line.setAttribute('stroke', 'url(#curve-glow-crashed)');
    const area = document.getElementById('crash-area');
    if (area) area.setAttribute('fill', 'url(#area-glow-crashed)');
    
    const emoji = document.getElementById('crash-rocket-emoji');
    if (emoji) emoji.textContent = '💥';
    
    const core = document.getElementById('crash-rocket-core');
    if (core) core.setAttribute('fill', '#f87171');
    
    const card = document.getElementById('crash-radar-card');
    if (card) card.style.transform = 'none';
    
  } else if (line && crashState === 'cashed_out') {
    line.setAttribute('stroke', 'var(--gold-primary)');
    const card = document.getElementById('crash-radar-card');
    if (card) card.style.transform = 'none';
  }
}

async function startCrash() {
  if (currentProfile.balance_coins < crashBet) {
    toastError('Solde insuffisant.');
    return;
  }
  
  crashPoint = generateCrashPoint();
  crashState = 'running';
  crashMultiplier = 1.00;
  crashTick = 0;
  
  const line = document.getElementById('crash-line');
  if (line) line.setAttribute('points', '0,300');
  const area = document.getElementById('crash-area');
  if (area) area.setAttribute('points', '0,300 0,300');
  
  const emoji = document.getElementById('crash-rocket-emoji');
  if (emoji) emoji.textContent = '🚀';
  
  const core = document.getElementById('crash-rocket-core');
  if (core) core.setAttribute('fill', '#4ade80');
  
  updateCrashUI();

  crashInterval = setInterval(() => {
    crashTick++;
    crashMultiplier = Math.round(Math.pow(1.03, crashTick) * 100) / 100;
    
    if (crashMultiplier >= crashPoint) {
      clearInterval(crashInterval);
      handleCrash();
      return;
    }
    
    const autoTarget = parseFloat(document.getElementById('auto-cashout-input')?.value || 0);
    if (autoTarget >= 1.01 && crashMultiplier >= autoTarget) {
      crashMultiplier = autoTarget; // Ajustement exact au point d'auto cash out
      clearInterval(crashInterval);
      cashOutCrash(true);
      return;
    }

    updateCrashUI();
  }, 100);
}

async function cashOutCrash(isAuto = false) {
  if (crashState !== 'running') return;
  clearInterval(crashInterval);
  crashState = 'cashed_out';
  
  const gainCoins = Math.floor(crashBet * crashMultiplier);
  const netCoins = gainCoins - crashBet;
  const desc = `Cash out à ×${crashMultiplier.toFixed(2)}`;

  // Mise à jour de l'interface instantanée (zéro latence)
  updateCrashUI();
  
  // Mise à jour optimiste du solde local pour affichage immédiat
  currentProfile.balance_coins += netCoins;
  const balanceEl = document.getElementById('navbar-balance');
  if (balanceEl) {
    balanceEl.textContent = formatCoins(currentProfile.balance_coins);
  }
  
  if (isAuto) {
    toastInfo(`Auto Cash Out déclenché à ×${crashMultiplier.toFixed(2)}`);
  } else {
    toastSuccess(`✅ Cash out à ×${crashMultiplier.toFixed(2)} ! +${netCoins} coins`);
  }

  try {
    await processGame(currentProfile.id, currentProfile.username, 'crash', crashBet, gainCoins, netCoins, desc);
    await refreshProfile();
    await incrementJackpot();
    await checkExplorerBonus();
  } catch (e) {
    // Annulation en cas d'erreur de base de données
    currentProfile.balance_coins -= netCoins;
    if (balanceEl) balanceEl.textContent = formatCoins(currentProfile.balance_coins);
    toastError('Erreur de synchronisation du gain');
  }
}

async function handleCrash() {
  crashState = 'crashed';
  crashMultiplier = crashPoint;
  
  // Mise à jour de l'interface instantanée (zéro latence)
  updateCrashUI();
  
  const desc = `Crash à ×${crashPoint.toFixed(2)} — Partie perdue`;
  
  // Mise à jour optimiste du solde local (perte de la mise)
  currentProfile.balance_coins -= crashBet;
  const balanceEl = document.getElementById('navbar-balance');
  if (balanceEl) {
    balanceEl.textContent = formatCoins(currentProfile.balance_coins);
  }
  
  toastError(`💥 Crash à ×${crashPoint.toFixed(2)} !`);
  
  try {
    await processGame(currentProfile.id, currentProfile.username, 'crash', crashBet, 0, -crashBet, desc);
    await refreshProfile();
    await incrementJackpot();
    await checkExplorerBonus();
  } catch (e) {
    // Réintégration en cas d'erreur
    currentProfile.balance_coins += crashBet;
    if (balanceEl) balanceEl.textContent = formatCoins(currentProfile.balance_coins);
  }
}

function resetCrash() {
  crashState = 'idle';
  crashMultiplier = 1.00;
  
  const line = document.getElementById('crash-line');
  if (line) line.setAttribute('points', '0,300');
  
  const area = document.getElementById('crash-area');
  if (area) area.setAttribute('points', '0,300 0,300');
  
  const emoji = document.getElementById('crash-rocket-emoji');
  if (emoji) emoji.textContent = '🚀';
  
  const rocket = document.getElementById('crash-rocket-node');
  if (rocket) rocket.setAttribute('transform', 'translate(0, 300)');
  
  const core = document.getElementById('crash-rocket-core');
  if (core) core.setAttribute('fill', '#4ade80');
  
  const card = document.getElementById('crash-radar-card');
  if (card) card.style.transform = 'none';
  
  const multDisplay = document.getElementById('crash-mult-display');
  if (multDisplay) multDisplay.style.transform = 'none';
  
  updateCrashUI();
}
