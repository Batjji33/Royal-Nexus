let minesBoard = []; // 25 slots: 'safe' or 'mine'
let revealedMines = []; // 25 booleans
let minesBet = 10;
let minesCount = 3;
let minesState = 'idle'; // idle | playing | cashout | exploded
let safeCellsRevealed = 0;
let minesMultiplier = 1.00;
let jackpotWonInThisSession = false;
let minMinesBet = 10;

function calculateMinesMultiplier(minesCount, safeRevealedCount) {
  if (safeRevealedCount === 0) return 1.00;
  const safeRemaining = 25 - minesCount - safeRevealedCount;
  // total_cells / safe_cells_remaining * 0.97
  // where safe_cells_remaining is the safe cells still hidden (not revealed yet)
  const safeRemainingHidden = 25 - minesCount - safeRevealedCount;
  const mult = (25 / Math.max(1, safeRemainingHidden)) * 0.97;
  return Math.max(1.01, Math.round(mult * 100) / 100);
}

async function renderMines() {
  const settings = await getSettings();
  minMinesBet = parseInt(settings.mines_min_bet || '10');
  minesBet = minMinesBet;
  minesState = 'idle';
  minesMultiplier = 1.00;
  safeCellsRevealed = 0;
  jackpotWonInThisSession = false;

  // Injection styles
  if (!document.getElementById('mines-custom-styles')) {
    const style = document.createElement('style');
    style.id = 'mines-custom-styles';
    style.textContent = `
      @keyframes explosionShake {
        0%, 100% { transform: translate(0, 0); }
        10%, 30%, 50%, 70%, 90% { transform: translate(-8px, -4px) rotate(-1deg); }
        20%, 40%, 60%, 80% { transform: translate(8px, 4px) rotate(1deg); }
      }
      .explosion-shake {
        animation: explosionShake 0.6s cubic-bezier(.36,.07,.19,.97) both;
      }
      @keyframes redFlash {
        0%, 100% { background-color: var(--bg-primary); }
        25%, 75% { background-color: #3b0707; }
      }
      .red-flash-bg {
        animation: redFlash 0.8s ease-in-out;
      }
      .safe-gold-flash {
        box-shadow: 0 0 30px rgba(201, 168, 76, 0.8);
        filter: brightness(1.4);
        transition: all 0.1s ease;
      }
      .safe-particle {
        position: absolute;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
      }
      .animate-fade-in-scale {
        animation: fadeInScale 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      }
      @keyframes fadeInScale {
        from { opacity: 0; transform: scale(0.5); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes explosionMinePulse {
        0%, 100% { box-shadow: 0 0 15px rgba(239, 68, 68, 0.4); transform: scale(1); }
        50% { box-shadow: 0 0 35px rgba(239, 68, 68, 1); transform: scale(1.08); }
      }
      .explosion-mine-pulse {
        animation: explosionMinePulse 0.5s ease-in-out infinite;
        z-index: 10;
        border-color: #ef4444 !important;
      }
      .mines-cell-safe-revealed {
        border-color: rgba(56, 189, 248, 0.4) !important;
        background: rgba(56, 189, 248, 0.02) !important;
        box-shadow: inset 0 0 15px rgba(56, 189, 248, 0.05) !important;
      }
    `;
    document.head.appendChild(style);
  }

  render(`
  ${renderNavbar()}
  <!-- Defs SVG globaux -->
  <svg style="position: absolute; width: 0; height: 0; overflow: hidden;">
    <defs>
      <linearGradient id="cell-unrevealed-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#202020" />
        <stop offset="50%" stop-color="#151515" />
        <stop offset="100%" stop-color="#0d0d0d" />
      </linearGradient>
      <linearGradient id="cell-unrevealed-border" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#8B6914" stop-opacity="0.5" />
        <stop offset="100%" stop-color="#C9A84C" stop-opacity="0.1" />
      </linearGradient>
      <linearGradient id="diamond-shimmer" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="30%" stop-color="#e0f2fe" />
        <stop offset="70%" stop-color="#38bdf8" />
        <stop offset="100%" stop-color="#0284c7" />
      </linearGradient>
      <linearGradient id="mine-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ef4444" />
        <stop offset="40%" stop-color="#991b1b" />
        <stop offset="100%" stop-color="#450a0a" />
      </linearGradient>
    </defs>
  </svg>

  <!-- Hero image -->
  <div style="height:260px;background-image:linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.85)),url('mines_lobby_card.png');
    background-size:cover;background-position:center;display:flex;flex-direction:column;align-items:center;justify-content:center;">
    <h1 style="font-family:'Cinzel';color:#fff;font-size:36px;letter-spacing:3px;">Mines</h1>
    <p style="font-family:'Cormorant Garamond';color:var(--text-secondary);font-size:18px;margin-top:8px;font-style:italic;">Désamorcez la grille et encaissez avant d'exploser</p>
  </div>

  <div style="max-width:1100px;margin:0 auto;padding:32px 24px;">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
      <a href="#/lobby" style="color:var(--text-muted);font-family:'Jost';font-size:13px;text-decoration:none;">← Retour au Lobby</a>
      
      <div class="jackpot-badge" style="margin:0;">
        <span>♦</span>
        <span>Jackpot : <strong>${formatCoins(jackpotCurrent)}</strong></span>
        <span style="color:#5A5040;">—</span>
        <span style="color:#C9A84C;font-weight:600;">15 cases safe</span>
      </div>
    </div>
    
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:32px;margin-top:16px;" id="mines-layout-container">
      
      <!-- GAUCHE : Grille de jeu -->
      <div class="card" id="mines-board-wrapper" style="display:flex;flex-direction:column;justify-content:center;align-items:center;padding:24px;background:#0d0d0d;border-color:var(--border-gold);min-height:440px;position:relative;transition:transform 0.05s ease;">
        <div id="mines-grid" style="display:grid;grid-template-columns:repeat(5, 1fr);gap:10px;width:100%;max-width:380px;aspect-ratio:1;">
          ${renderInitialGridHTML()}
        </div>
      </div>

      <!-- DROITE : Panneau de contrôle -->
      <div class="card" style="display:flex;flex-direction:column;justify-content:space-between;min-height:440px;">
        <div id="mines-controls">
          ${renderMinesControlsHTML()}
        </div>
        
        <div id="mines-action-button-area" style="margin-top:24px;">
          ${renderMinesActionButtonHTML()}
        </div>
      </div>
      
    </div>
  </div>`);

  updateMinesUI();
}

function renderInitialGridHTML() {
  let html = '';
  for (let i = 0; i < 25; i++) {
    html += `
      <div id="mines-cell-${i}" class="card cursor-pointer flex items-center justify-center p-0 overflow-hidden relative select-none" style="aspect-ratio:1; transition: transform 0.15s ease;" onclick="clickMinesCell(${i})">
        <svg viewBox="0 0 80 80" class="w-full h-full">
          <rect x="2" y="2" width="76" height="76" rx="8" fill="url(#cell-unrevealed-grad)" stroke="url(#cell-unrevealed-border)" stroke-width="1.5"/>
          <polygon points="40,24 48,40 40,56 32,40" fill="rgba(201, 168, 76, 0.12)" stroke="rgba(201, 168, 76, 0.25)" stroke-width="1"/>
        </svg>
      </div>
    `;
  }
  return html;
}

function renderCellContentHTML(idx) {
  if (!revealedMines[idx]) {
    return `
      <svg viewBox="0 0 80 80" class="w-full h-full">
        <rect x="2" y="2" width="76" height="76" rx="8" fill="url(#cell-unrevealed-grad)" stroke="url(#cell-unrevealed-border)" stroke-width="1.5"/>
        <polygon points="40,24 48,40 40,56 32,40" fill="rgba(201, 168, 76, 0.12)" stroke="rgba(201, 168, 76, 0.25)" stroke-width="1"/>
      </svg>
    `;
  }
  
  if (minesBoard[idx] === 'mine') {
    return `
      <svg viewBox="0 0 80 80" class="w-full h-full animate-fade-in-scale">
        <rect x="2" y="2" width="76" height="76" rx="8" fill="#180a0a" stroke="#ef4444" stroke-width="1.5"/>
        <g transform="translate(40,40)">
          <circle r="16" fill="rgba(239, 68, 68, 0.2)" style="filter: blur(5px);"/>
          <line x1="0" y1="-22" x2="0" y2="22" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
          <line x1="-22" y1="0" x2="22" y2="0" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
          <line x1="-16" y1="-16" x2="16" y2="16" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
          <line x1="-16" y1="16" x2="16" y2="-16" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
          <circle r="12" fill="url(#mine-grad)" stroke="#1a0505" stroke-width="1.5"/>
          <circle cx="-3" cy="-3" r="4" fill="rgba(255,255,255,0.4)" style="filter: blur(1px);"/>
        </g>
      </svg>
    `;
  } else {
    return `
      <svg viewBox="0 0 80 80" class="w-full h-full animate-fade-in-scale">
        <rect x="2" y="2" width="76" height="76" rx="8" fill="rgba(201, 168, 76, 0.05)" stroke="url(#cell-unrevealed-border)" stroke-width="1.5"/>
        <g transform="translate(40,40)">
          <circle r="18" fill="rgba(56, 189, 248, 0.15)" style="filter: blur(4px);"/>
          <polygon points="0,-18 14,0 0,18 -14,0" fill="url(#diamond-shimmer)"/>
          <polygon points="0,-18 0,0 -14,0" fill="rgba(255,255,255,0.6)"/>
          <polygon points="0,-18 14,0 0,0" fill="rgba(255,255,255,0.3)"/>
          <polygon points="0,18 0,0 -14,0" fill="rgba(2,132,199,0.4)"/>
          <polygon points="0,18 14,0 0,0" fill="rgba(2,132,199,0.2)"/>
          <line x1="-8" y1="-8" x2="8" y2="8" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" opacity="0.8"/>
        </g>
      </svg>
    `;
  }
}

function renderMinesControlsHTML() {
  const isPlaying = minesState === 'playing';
  return `
    <h3 style="font-family:'Cinzel';color:var(--gold-primary);font-size:18px;margin-bottom:20px;letter-spacing:1px;">Options de mise</h3>
    
    <!-- Mise input -->
    <div style="margin-bottom:20px;">
      <label style="font-family:'Jost';color:var(--text-secondary);font-size:13px;display:block;margin-bottom:6px;">Montant à miser (coins)</label>
      <input type="number" id="mines-bet-input" class="input-gold" value="${minesBet}" min="${minMinesBet}" step="10" ${isPlaying ? 'disabled' : ''} oninput="updateMinesCostDisplay()">
      <p id="mines-cost-preview-text" style="font-family:'Cormorant Garamond';color:var(--gold-primary);font-size:15px;margin-top:6px;font-style:italic;">
        Coût de la partie : <strong>${minesBet}</strong> coins
      </p>
    </div>

    <!-- Quick bets buttons -->
    <div style="display:flex;gap:8px;margin-bottom:24px;">
      <button onclick="setMinesBetMin()" class="btn-outline-gold" style="flex:1;padding:8px;font-size:13px;" ${isPlaying ? 'disabled' : ''}>Min</button>
      <button onclick="multiplyMinesBet(2)" class="btn-outline-gold" style="flex:1;padding:8px;font-size:13px;" ${isPlaying ? 'disabled' : ''}>×2</button>
      <button onclick="multiplyMinesBet(4)" class="btn-outline-gold" style="flex:1;padding:8px;font-size:13px;" ${isPlaying ? 'disabled' : ''}>×4</button>
    </div>

    <!-- Mines count selector -->
    <div style="margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <label style="font-family:'Jost';color:var(--text-secondary);font-size:13px;margin:0;">Nombre de Mines</label>
        <span id="mines-count-display" style="font-family:'Cormorant Garamond';color:var(--gold-primary);font-size:18px;font-weight:700;background:rgba(201,168,76,0.1);padding:2px 10px;border-radius:4px;border:1px solid rgba(201,168,76,0.2);">${minesCount}</span>
      </div>
      <input type="range" id="mines-range-input" min="1" max="20" value="${minesCount}" class="w-full h-1 rounded-lg appearance-none cursor-pointer" style="accent-color: var(--gold-primary); background:var(--bg-secondary); outline:none;" ${isPlaying ? 'disabled' : ''} oninput="updateMinesCountDisplay()">
    </div>
  `;
}

function renderMinesActionButtonHTML() {
  if (minesState === 'playing') {
    const currentWin = Math.floor(minesBet * minesMultiplier);
    return `
      <div style="text-align:center;">
        <div style="background:rgba(56,189,248,0.06);border:1px solid rgba(56, 189, 248, 0.25);border-radius:8px;padding:12px;margin-bottom:16px;">
          <p style="font-family:'Jost';color:var(--text-secondary);font-size:13px;margin-bottom:4px;">Gain accumulé (×<span id="mines-live-mult">${minesMultiplier.toFixed(2)}</span>)</p>
          <p style="font-family:'Cormorant Garamond';color:#38bdf8;font-size:28px;font-weight:700;letter-spacing:1px;text-shadow:0 0 15px rgba(56,189,248,0.3);">
            <span id="mines-live-win">${currentWin}</span> coins
          </p>
        </div>
        
        <button id="mines-cashout-btn" onclick="cashOutMines()" class="btn-success" style="width:100%;padding:16px;font-size:18px;font-weight:700;letter-spacing:1px;box-shadow:0 0 20px rgba(45,122,58,0.4);" ${safeCellsRevealed === 0 ? 'disabled' : ''}>
          CASH OUT
        </button>
      </div>
    `;
  } else {
    return `
      <button onclick="startMinesGame()" class="btn-gold" style="width:100%;padding:16px;font-size:18px;letter-spacing:2px;font-weight:700;">
        DÉMARRER
      </button>
    `;
  }
}

function updateMinesCostDisplay() {
  const input = document.getElementById('mines-bet-input');
  if (input) {
    let val = Math.round(parseFloat(input.value) || minMinesBet);
    if (val < minMinesBet) val = minMinesBet;
    minesBet = val;
    const preview = document.getElementById('mines-cost-preview-text');
    if (preview) {
      preview.innerHTML = `Coût de la partie : <strong>${minesBet}</strong> coins`;
    }
  }
}

function updateMinesCountDisplay() {
  const range = document.getElementById('mines-range-input');
  const display = document.getElementById('mines-count-display');
  if (range && display) {
    minesCount = parseInt(range.value);
    display.textContent = minesCount;
  }
}

function setMinesBetMin() {
  if (minesState === 'playing') return;
  const input = document.getElementById('mines-bet-input');
  if (input) {
    input.value = minMinesBet;
    updateMinesCostDisplay();
  }
}

function multiplyMinesBet(factor) {
  if (minesState === 'playing') return;
  const input = document.getElementById('mines-bet-input');
  if (input) {
    let val = Math.round(parseFloat(input.value) || minMinesBet);
    input.value = Math.max(minMinesBet, Math.round(val * factor));
    updateMinesCostDisplay();
  }
}

function updateMinesUI() {
  // Renders the correct state for the control panel and buttons
  const controlsEl = document.getElementById('mines-controls');
  if (controlsEl) {
    controlsEl.innerHTML = renderMinesControlsHTML();
  }
  const actionBtnEl = document.getElementById('mines-action-button-area');
  if (actionBtnEl) {
    actionBtnEl.innerHTML = renderMinesActionButtonHTML();
  }
  
  // Style and lock range inputs
  const rangeInput = document.getElementById('mines-range-input');
  if (rangeInput) {
    rangeInput.disabled = (minesState === 'playing');
    rangeInput.style.opacity = (minesState === 'playing') ? '0.5' : '1';
  }
  
  const betInput = document.getElementById('mines-bet-input');
  if (betInput) {
    betInput.disabled = (minesState === 'playing');
  }
}

async function startMinesGame() {
  if (minesState === 'playing') return;

  const betInput = document.getElementById('mines-bet-input');
  const betVal = Math.round(parseFloat(betInput ? betInput.value : minMinesBet));

  if (isNaN(betVal) || betVal < minMinesBet) {
    toastError(`Mise minimale de ${minMinesBet} coins.`);
    return;
  }

  if (currentProfile.balance_coins < betVal) {
    toastError('Solde insuffisant. Redirection vers le portefeuille...');
    setTimeout(() => navigatePage('#/wallet'), 1800);
    return;
  }

  const rangeInput = document.getElementById('mines-range-input');
  minesCount = parseInt(rangeInput ? rangeInput.value : 3);
  if (isNaN(minesCount) || minesCount < 1 || minesCount > 20) {
    toastError('Nombre de mines invalide (1 - 20).');
    return;
  }

  // Deduct bet and set game variables
  minesBet = betVal;
  minesState = 'playing';
  safeCellsRevealed = 0;
  minesMultiplier = 1.00;
  jackpotWonInThisSession = false;

  // Initialize board: 25 cells, exactly minesCount mines
  minesBoard = Array(25).fill('safe');
  let placedMines = 0;
  while (placedMines < minesCount) {
    const idx = Math.floor(Math.random() * 25);
    if (minesBoard[idx] === 'safe') {
      minesBoard[idx] = 'mine';
      placedMines++;
    }
  }

  revealedMines = Array(25).fill(false);

  // Redessiner la grille
  const gridEl = document.getElementById('mines-grid');
  if (gridEl) {
    gridEl.innerHTML = renderInitialGridHTML();
  }

  updateMinesUI();
  
  // Notice the user that game started
  toastInfo('Partie lancée. Bonne chance !');
}

async function clickMinesCell(idx) {
  if (minesState !== 'playing') return;
  if (revealedMines[idx]) return;

  revealedMines[idx] = true;
  const cellEl = document.getElementById(`mines-cell-${idx}`);
  if (!cellEl) return;

  if (minesBoard[idx] === 'mine') {
    // Exploded!
    cellEl.innerHTML = renderCellContentHTML(idx);
    await triggerExplosion(idx);
  } else {
    // Safe case clicked
    safeCellsRevealed++;
    cellEl.innerHTML = renderCellContentHTML(idx);
    cellEl.classList.add('mines-cell-safe-revealed');

    // Bounce animation
    cellEl.style.transform = 'scale(0.92)';
    setTimeout(() => cellEl.style.transform = 'none', 130);

    // Particle flash system
    createSafeParticles(cellEl);

    // Recalculate multiplier
    minesMultiplier = calculateMinesMultiplier(minesCount, safeCellsRevealed);

    // Update displays
    updateMinesLiveStats();

    // Check Jackpot: 15 or more safe cases revealed in a single game
    if (safeCellsRevealed >= 15 && !jackpotWonInThisSession && !isAdmin()) {
      jackpotWonInThisSession = true;
      await awardJackpot();
    }

    // Auto cash out if no safe cells remain
    const totalSafe = 25 - minesCount;
    if (safeCellsRevealed === totalSafe) {
      await cashOutMines(true);
    }
  }
}

function updateMinesLiveStats() {
  const winDisplay = document.getElementById('mines-live-win');
  const liveMult = document.getElementById('mines-live-mult');

  if (winDisplay) {
    const currentWin = Math.floor(minesBet * minesMultiplier);
    winDisplay.textContent = currentWin;
  }

  if (liveMult) {
    liveMult.textContent = minesMultiplier.toFixed(2);
  }

  const cashoutBtn = document.getElementById('mines-cashout-btn');
  if (cashoutBtn) {
    cashoutBtn.disabled = (safeCellsRevealed === 0);
  }
}

async function triggerExplosion(clickedIndex) {
  minesState = 'exploded';

  // Screen shake and red overlay pulse
  const wrapper = document.getElementById('mines-board-wrapper');
  if (wrapper) {
    wrapper.classList.add('explosion-shake');
    document.body.classList.add('red-flash-bg');
    setTimeout(() => {
      wrapper.classList.remove('explosion-shake');
      document.body.classList.remove('red-flash-bg');
    }, 700);
  }

  // Highlight the clicked mine with glowing pulse class
  revealCell(clickedIndex, 'mine', true);
  toastError('💥 Boum ! Explosion.');

  // Find all remaining mines and order them by distance from clicked position for cascade wave effect
  const mineIndices = [];
  for (let i = 0; i < 25; i++) {
    if (minesBoard[i] === 'mine' && i !== clickedIndex) {
      mineIndices.push(i);
    }
  }

  const clickedRow = Math.floor(clickedIndex / 5);
  const clickedCol = clickedIndex % 5;
  mineIndices.sort((a, b) => {
    const distA = Math.hypot(Math.floor(a / 5) - clickedRow, (a % 5) - clickedCol);
    const distB = Math.hypot(Math.floor(b / 5) - clickedRow, (b % 5) - clickedCol);
    return distA - distB;
  });

  // Cascade reveal sequence
  for (const idx of mineIndices) {
    await new Promise(r => setTimeout(r, 120));
    revealCell(idx, 'mine', false);
  }

  // Reveal safe cells that were missed as transparent unselected
  for (let i = 0; i < 25; i++) {
    if (!revealedMines[i]) {
      revealedMines[i] = true;
      const el = document.getElementById(`mines-cell-${i}`);
      if (el) {
        el.innerHTML = renderCellContentHTML(i);
        el.style.opacity = '0.35';
      }
    }
  }

  // Deduct the loss in Supabase DB and increment jackpot
  await finalizeMinesGame(false);
}

function revealCell(idx, type, clicked) {
  revealedMines[idx] = true;
  const cellEl = document.getElementById(`mines-cell-${idx}`);
  if (cellEl) {
    cellEl.innerHTML = renderCellContentHTML(idx);
    if (clicked && type === 'mine') {
      cellEl.classList.add('explosion-mine-pulse');
    }
  }
}

async function cashOutMines(isAuto = false) {
  if (minesState !== 'playing') return;

  minesState = 'cashout';
  const gainCoins = Math.floor(minesBet * minesMultiplier);
  const netCoins = gainCoins - minesBet;
  const desc = `Mines (${minesCount} mines, ${safeCellsRevealed} cases) — Cash out à ×${minesMultiplier.toFixed(2)}`;

  // Optimistic balance increase
  currentProfile.balance_coins += netCoins;
  const balanceEl = document.getElementById('navbar-balance');
  if (balanceEl) {
    balanceEl.textContent = formatCoins(currentProfile.balance_coins);
  }

  // Show all cells
  for (let i = 0; i < 25; i++) {
    if (!revealedMines[i]) {
      revealedMines[i] = true;
      const el = document.getElementById(`mines-cell-${i}`);
      if (el) {
        el.innerHTML = renderCellContentHTML(i);
        if (minesBoard[i] === 'safe') {
          el.style.opacity = '0.8';
        } else {
          el.style.opacity = '0.3';
        }
      }
    }
  }

  // Glorious gold rain animation
  triggerCashOutCoinsRain(gainCoins);

  if (isAuto) {
    toastSuccess(`✨ Victoire absolue ! Toutes les cases safe ont été retournées. Gain : +${netCoins} coins`);
  } else {
    toastSuccess(`✅ Encaissé à ×${minesMultiplier.toFixed(2)} ! Gain net : +${netCoins} coins`);
  }

  try {
    await processGame(currentProfile.id, currentProfile.username, 'mines', minesBet, gainCoins, netCoins, desc);
    await refreshProfile();
    await incrementJackpot();
  } catch (e) {
    // Revert local changes on error
    currentProfile.balance_coins -= netCoins;
    if (balanceEl) balanceEl.textContent = formatCoins(currentProfile.balance_coins);
    toastError('Erreur de synchronisation du gain');
  }

  updateMinesUI();
}

async function finalizeMinesGame(won) {
  if (!won) {
    const desc = `Mines (${minesCount} mines, ${safeCellsRevealed} cases) — Explosion sur mine`;
    
    // Optimistic balance loss
    currentProfile.balance_coins -= minesBet;
    const balanceEl = document.getElementById('navbar-balance');
    if (balanceEl) {
      balanceEl.textContent = formatCoins(currentProfile.balance_coins);
    }
    
    try {
      await processGame(currentProfile.id, currentProfile.username, 'mines', minesBet, 0, -minesBet, desc);
      await refreshProfile();
      await incrementJackpot();
    } catch (e) {
      // Revert local changes on error
      currentProfile.balance_coins += minesBet;
      if (balanceEl) balanceEl.textContent = formatCoins(currentProfile.balance_coins);
      toastError('Erreur de synchronisation du solde');
    }
    
    updateMinesUI();
  }
}

function createSafeParticles(cellElement) {
  cellElement.classList.add('safe-gold-flash');
  setTimeout(() => cellElement.classList.remove('safe-gold-flash'), 500);

  const rect = cellElement.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2 + window.scrollX;
  const centerY = rect.top + rect.height / 2 + window.scrollY;

  const colors = ['#C9A84C', '#E2C97E', '#FFF', '#8B6914'];

  for (let i = 0; i < 15; i++) {
    const particle = document.createElement('div');
    particle.className = 'safe-particle';
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    particle.style.left = `${centerX}px`;
    particle.style.top = `${centerY}px`;

    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 4.5;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    document.body.appendChild(particle);

    let x = centerX;
    let y = centerY;
    let opacity = 1;

    const animate = () => {
      x += vx;
      y += vy;
      opacity -= 0.035;

      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.opacity = opacity;

      if (opacity > 0) {
        requestAnimationFrame(animate);
      } else {
        particle.remove();
      }
    };

    requestAnimationFrame(animate);
  }
}

function triggerCashOutCoinsRain(amount) {
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0,0,0,0.85);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  `;

  const winDisplay = document.createElement('div');
  winDisplay.style.cssText = `
    text-align: center;
    animation: fadeInScale 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  `;
  winDisplay.innerHTML = `
    <div style="font-family:'Cinzel';color:#C9A84C;font-size:16px;letter-spacing:3px;margin-bottom:8px;">ENCASSEMENT RÉUSSI</div>
    <div style="font-family:'Cormorant Garamond';font-weight:700;font-size:72px;color:#C9A84C;text-shadow:0 0 35px rgba(201,168,76,0.6);margin-bottom:12px;">+${amount} coins</div>
    <div style="font-family:'Jost';color:#A89A7A;font-size:16px;">Félicitations ! Vos gains ont été crédités.</div>
  `;
  container.appendChild(winDisplay);
  document.body.appendChild(container);

  const coinSymbols = ['🪙', '✨', '💎'];
  for (let i = 0; i < 40; i++) {
    const coin = document.createElement('div');
    coin.style.cssText = `
      position: absolute;
      top: -40px;
      font-size: ${16 + Math.random() * 20}px;
      animation: coinFall ${1.5 + Math.random() * 2}s linear forwards;
      animation-delay: ${Math.random() * 1.5}s;
      left: ${Math.random() * 100}vw;
      pointer-events: none;
      z-index: 10000;
      user-select: none;
    `;
    coin.textContent = coinSymbols[Math.floor(Math.random() * coinSymbols.length)];
    container.appendChild(coin);
  }

  if (!document.getElementById('coin-fall-style')) {
    const style = document.createElement('style');
    style.id = 'coin-fall-style';
    style.textContent = `
      @keyframes coinFall {
        0% { transform: translateY(-40px) rotate(0deg); opacity: 1; }
        100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  setTimeout(() => {
    container.style.transition = 'opacity 0.5s ease';
    container.style.opacity = '0';
    setTimeout(() => container.remove(), 500);
  }, 3500);
}
