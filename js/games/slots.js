const SLOTS_SYMBOLS = [
  { id:'cherry',  emoji:'🍒', label:'Cerise',   weight:35, payout:2  },
  { id:'lemon',   emoji:'🍋', label:'Citron',   weight:28, payout:3  },
  { id:'bell',    emoji:'🔔', label:'Cloche',   weight:18, payout:5  },
  { id:'star',    emoji:'⭐', label:'Étoile',   weight:10, payout:10 },
  { id:'diamond', emoji:'💎', label:'Diamant',  weight:6,  payout:25 },
  { id:'seven',   emoji:'7️⃣', label:'Lucky 7', weight:3,  payout:50 },
];

function weightedRandom() {
  const total = SLOTS_SYMBOLS.reduce((s, sym) => s + sym.weight, 0);
  let r = Math.random() * total;
  for (const sym of SLOTS_SYMBOLS) {
    r -= sym.weight;
    if (r <= 0) return sym;
  }
  return SLOTS_SYMBOLS[SLOTS_SYMBOLS.length - 1];
}

function generateGrid() {
  return Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => weightedRandom()));
}

let slotsCost = 5;
let slotsMultiplier = 1;
let slotsSpinning = false;

async function renderSlots() {
  const settings = await getSettings();
  slotsCost = parseInt(settings.slots_cost_per_spin || '5');
  slotsMultiplier = 1;

  render(`
  ${renderNavbar()}
  <!-- Hero image -->
  <div style="height:260px;background-image:linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.85)),url('imgbloc-mas-roul1.jpg');
    background-size:cover;background-position:center;display:flex;flex-direction:column;align-items:center;justify-content:center;">
    <h1 style="font-family:'Cinzel';color:#fff;font-size:36px;letter-spacing:3px;">Machine à Sous</h1>
    <p style="font-family:'Cormorant Garamond';color:var(--text-secondary);font-size:18px;margin-top:8px;font-style:italic;">Alignez les symboles pour décrocher le jackpot</p>
  </div>

  <div style="max-width:900px;margin:0 auto;padding:32px 24px;text-align:center;">
    <div style="text-align:left;margin-bottom:24px;">
      <a href="#/lobby" style="color:var(--text-muted);font-family:'Jost';font-size:13px;text-decoration:none;">← Retour au Lobby</a>
      
      <div class="jackpot-badge" style="margin-top:16px;">
        <span>♦</span>
        <span>Jackpot : <strong>${formatCoins(jackpotCurrent)}</strong></span>
        <span style="color:#5A5040;">—</span>
        <span style="color:#5A5040;">Lucky 7</span>
      </div>
    </div>

    <div class="slots-card">
      <div id="slots-grid" style="display:grid;grid-template-columns:repeat(3, 1fr);gap:16px;">
        <!-- Initial Grid -->
        ${Array.from({length:3}).map(() => `
          <div class="slots-column">
            <div class="slots-symbol-bg">🍒</div>
            <div class="slots-symbol-main">🍋</div>
            <div class="slots-symbol-bg">🔔</div>
          </div>
        `).join('')}
      </div>
      <p style="font-family:'Jost';color:var(--gold-primary);font-size:14px;margin-top:24px;letter-spacing:1px;text-transform:uppercase;">
        Combinaison gagnante sur la ligne centrale
      </p>
    </div>

    <div class="card" style="margin-top:32px;max-width:600px;margin-left:auto;margin-right:auto;">
      <p style="font-family:'Cormorant Garamond';color:var(--gold-primary);font-size:18px;margin-bottom:16px;">
        Ce spin vous coûte <strong id="slots-cost-display">${slotsCost * slotsMultiplier}</strong> coins
      </p>
      
      <div style="display:flex;justify-content:center;gap:12px;margin-bottom:24px;">
        ${[1, 2, 5, 10].map(m => `
          <button onclick="setSlotsMultiplier(${m})" id="btn-mult-${m}" class="${m===1?'btn-gold':'btn-outline-gold'}" style="padding:8px 20px;font-size:14px;">×${m}</button>
        `).join('')}
      </div>

      <button id="btn-spin-slots" onclick="spinSlots()" class="btn-gold" style="width:100%;padding:16px;font-size:18px;letter-spacing:2px;">
        SPIN
      </button>

      <details style="margin-top:24px;text-align:left;">
        <summary style="font-family:'Jost';color:var(--text-muted);font-size:13px;cursor:pointer;">Tableau des gains</summary>
        <table class="table-royal" style="margin-top:12px;font-size:13px;">
          ${SLOTS_SYMBOLS.slice().reverse().map(s => `
            <tr><td>3× ${s.emoji} ${s.label}</td><td style="color:var(--gold-primary);">×${s.payout}</td></tr>
          `).join('')}
        </table>
      </details>
    </div>
  </div>`);
}

function setSlotsMultiplier(m) {
  if (slotsSpinning) return;
  slotsMultiplier = m;
  document.getElementById('slots-cost-display').textContent = slotsCost * m;
  [1, 2, 5, 10].forEach(mult => {
    const btn = document.getElementById(`btn-mult-${mult}`);
    if (mult === m) {
      btn.className = 'btn-gold';
    } else {
      btn.className = 'btn-outline-gold';
    }
  });
}

async function animateReels(grid) {
  const container = document.getElementById('slots-grid');
  
  // Animation state
  for (let i = 0; i < 20; i++) {
    const tempGrid = generateGrid();
    container.innerHTML = renderGridHTML(tempGrid);
    await new Promise(r => setTimeout(r, 50));
  }
  
  // Stop sequence: reel 1, then 2, then 3
  const finalGrid = [generateGrid()[0], generateGrid()[1], generateGrid()[2]];
  
  for (let reel = 0; reel < 3; reel++) {
    finalGrid[reel] = grid[reel];
    container.innerHTML = renderGridHTML(finalGrid);
    await new Promise(r => setTimeout(r, 400));
  }
}

function renderGridHTML(grid) {
  return grid.map((reel) => `
    <div class="slots-column">
      <div class="slots-symbol-bg">${reel[0].emoji}</div>
      <div class="slots-symbol-main">${reel[1].emoji}</div>
      <div class="slots-symbol-bg">${reel[2].emoji}</div>
    </div>
  `).join('');
}

async function spinSlots() {
  if (slotsSpinning) return;
  
  const totalCost = slotsCost * slotsMultiplier;
  if (currentProfile.balance_coins < totalCost) {
    toastError('Solde insuffisant. Rechargez votre compte depuis le Portefeuille.');
    return;
  }

  slotsSpinning = true;
  const btn = document.getElementById('btn-spin-slots');
  btn.disabled = true;
  btn.textContent = 'SPINNING...';

  const grid = generateGrid();
  
  // Check payline (middle row)
  let midRow = [grid[0][1], grid[1][1], grid[2][1]];
  let won = midRow[0].id === midRow[1].id && midRow[1].id === midRow[2].id;

  // Boost Royal Slots : 25% de chance de transformer une défaite en victoire !
  if (!won && Math.random() < 0.25) {
    const luckySymbol = weightedRandom();
    grid[0][1] = luckySymbol;
    grid[1][1] = luckySymbol;
    grid[2][1] = luckySymbol;
    midRow = [luckySymbol, luckySymbol, luckySymbol];
    won = true;
  }

  const symbol = midRow[0];

  await animateReels(grid);

  const gainCoins = won ? totalCost * symbol.payout : 0;
  const netCoins = won ? totalCost * (symbol.payout - 1) : -totalCost;
  const desc = won ? `3× ${symbol.label} — Victoire ×${symbol.payout}` : 'Aucune combinaison';

  try {
    await processGame(currentProfile.id, currentProfile.username, 'slots', totalCost, gainCoins, netCoins, desc);
    await refreshProfile();
    await incrementJackpot();
    if (won) await checkSlotsJackpot(midRow[0].id);
    await checkExplorerBonus();
    
    if (won) {
      if (symbol.id === 'seven') {
        toastSuccess(`🎰 JACKPOT ! 3× Lucky 7 ! +${netCoins} coins !`);
      } else {
        toastSuccess(`✨ Victoire ! 3× ${symbol.label} ! +${netCoins} coins`);
      }
    } else {
      toastError(`Aucune combinaison — ${totalCost} coins dépensés`);
    }
  } catch (e) {
    toastError('Erreur lors du traitement de la partie.');
  }

  slotsSpinning = false;
  btn.disabled = false;
  btn.textContent = 'SPIN';
}
