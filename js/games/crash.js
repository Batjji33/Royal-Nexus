let crashState = 'idle'; // idle | running | cashed_out | crashed
let crashMultiplier = 1.00;
let crashPoint = 1.00;
let crashBet = 10;
let crashTick = 0;
let crashInterval = null;
let minCrashBet = 10;

function generateCrashPoint() {
  const r = Math.random();
  
  // 22% de chance de crash instantané à 1.00 (très punitif)
  if (r < 0.22) return 1.00;
  
  // 33% de chance de crash très précoce (entre 1.01 et 1.45)
  if (r < 0.55) {
    return Math.max(1.01, Math.round((1.01 + Math.random() * 0.44) * 100) / 100);
  }
  
  // 30% de chance de crash moyen (entre 1.46 et 2.50)
  if (r < 0.85) {
    return Math.max(1.46, Math.round((1.46 + Math.random() * 1.04) * 100) / 100);
  }
  
  // 15% restants : au-dessus de 2.50 avec un aplatissement extrême (de type Pareto très serré)
  const r2 = Math.random();
  const exponent = 1 / 2.8; // Très forte décroissance pour limiter la hausse
  const val = 2.50 / Math.pow(1 - r2, exponent);
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
      
      <!-- GAUCHE : Graphique -->
      <div class="card" style="display:flex;flex-direction:column;position:relative;min-height:400px;background:#050a05;border-color:rgba(74,222,128,0.2);">
        <svg id="crash-svg" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;" preserveAspectRatio="none">
          <polyline id="crash-line" points="0,400" fill="none" stroke="#4ade80" stroke-width="4"/>
        </svg>
        <div style="margin:auto;text-align:center;z-index:10;">
          <div id="crash-mult-display" style="font-family:'Cormorant Garamond';font-size:80px;font-weight:700;color:#4ade80;text-shadow:0 0 20px rgba(74,222,128,0.4);">
            ×1.00
          </div>
          <div id="crash-status-msg" style="font-family:'Jost';color:var(--text-secondary);font-size:16px;margin-top:16px;height:24px;">
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
    line.setAttribute('stroke', '#4ade80');
    // Draw logic (simplified)
    const points = line.getAttribute('points');
    const newX = Math.min(800, crashTick * 5); // arbitrary scaling
    const newY = Math.max(0, 400 - (crashMultiplier - 1) * 100);
    line.setAttribute('points', `${points} ${newX},${newY}`);
  } else if (line && crashState === 'crashed') {
    line.setAttribute('stroke', '#f87171');
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
  if (line) line.setAttribute('points', '0,400');
  
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
  if (line) line.setAttribute('points', '0,400');
  updateCrashUI();
}
