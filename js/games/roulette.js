const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const ROULETTE_WHEEL = [0, '00', ...Array.from({length:36},(_,i)=>i+1)];
const AMERICAN_ORDER = [0, 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3, 24, 36, 13, 1, '00', 27, 10, 25, 29, 12, 8, 19, 31, 18, 6, 21, 33, 16, 4, 23, 35, 14, 2];

function getWedgePath(cx, cy, rx1, ry1, rx2, ry2, startAngle, endAngle) {
  const rad = Math.PI / 180;
  const x1out = cx + rx1 * Math.cos(startAngle * rad);
  const y1out = cy + ry1 * Math.sin(startAngle * rad);
  const x2out = cx + rx1 * Math.cos(endAngle * rad);
  const y2out = cy + ry1 * Math.sin(endAngle * rad);
  
  const x1in = cx + rx2 * Math.cos(endAngle * rad);
  const y1in = cy + ry2 * Math.sin(endAngle * rad);
  const x2in = cx + rx2 * Math.cos(startAngle * rad);
  const y2in = cy + ry2 * Math.sin(startAngle * rad);
  
  return `M ${x1out} ${y1out} A ${rx1} ${ry1} 0 0 1 ${x2out} ${y2out} L ${x1in} ${y1in} A ${rx2} ${ry2} 0 0 0 ${x2in} ${y2in} Z`;
}

function generateRouletteSlices() {
  const slicesGroup = document.getElementById('svg-slices');
  if (!slicesGroup) return;
  
  let slicesHTML = '';
  const anglePerSlice = 360 / 38;
  AMERICAN_ORDER.forEach((num, i) => {
    const startAngle = i * anglePerSlice - 90;
    const endAngle = startAngle + anglePerSlice;
    const color = getColor(num);
    const bg = color === 'red' ? '#8B0000' : color === 'green' ? '#2D7A3A' : '#111111';
    
    const pathD = getWedgePath(100, 100, 95, 95, 46, 46, startAngle, endAngle);
    const midAngle = startAngle + anglePerSlice / 2;
    
    slicesHTML += `
      <g id="slice-group-${num}">
        <path d="${pathD}" fill="${bg}" stroke="#C9A84C" stroke-width="0.3" id="slice-${num}"/>
        <text x="100" y="19" font-family="'Jost', sans-serif" font-size="7.5" font-weight="600" fill="#fff" 
          text-anchor="middle" dominant-baseline="middle" transform="rotate(${midAngle + 90}, 100, 100)">${num}</text>
      </g>
    `;
  });
  slicesGroup.innerHTML = slicesHTML;
}

function getColor(n) {
  if (n === 0 || n === '00') return 'green';
  return RED_NUMBERS.includes(Number(n)) ? 'red' : 'black';
}

function checkWin(betType, result) {
  const n = result === '00' ? -1 : Number(result);
  switch(betType) {
    case 'red':    return RED_NUMBERS.includes(n);
    case 'black':  return n > 0 && !RED_NUMBERS.includes(n);
    case 'odd':    return n > 0 && n % 2 !== 0;
    case 'even':   return n > 0 && n % 2 === 0;
    case 'low':    return n >= 1 && n <= 18;
    case 'high':   return n >= 19 && n <= 36;
    case 'dozen1': return n >= 1 && n <= 12;
    case 'dozen2': return n >= 13 && n <= 24;
    case 'dozen3': return n >= 25 && n <= 36;
    default:
      if (betType && betType.startsWith('num_')) return String(result) === betType.replace('num_','');
      return false;
  }
}

function getPayout(betType) {
  if (betType && betType.startsWith('num_')) return 36;
  const p = {red:2,black:2,odd:2,even:2,low:2,high:2,dozen1:3,dozen2:3,dozen3:3};
  return p[betType] || 2;
}

let selectedBet = 'red';
let rouletteSpinning = false;

async function renderRoulette() {
  const settings = await getSettings();
  const minBet = parseInt(settings.roulette_min_bet || '5');

  const numbersGrid = ROULETTE_WHEEL.map(n => {
    const c = getColor(n);
    const bg = c==='red'?'#8B0000':c==='green'?'#2D7A3A':'#1a1a1a';
    return `<button onclick="selectBet('num_${n}')" data-bet="num_${n}"
      style="width:36px;height:36px;background:${bg};border:1px solid rgba(255,255,255,0.1);
      border-radius:4px;color:#fff;font-family:'Jost';font-size:11px;cursor:pointer;transition:opacity 0.2s;">
      ${n}</button>`;
  }).join('');

  render(`
  ${renderNavbar()}
  <!-- Hero image -->
  <div style="height:260px;background-image:linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.85)),url('360_F_187706793_ZJ9Dp3C4obZzN3EQBf297LBf50X3bpx1.jpg');
    background-size:cover;background-position:center;display:flex;flex-direction:column;align-items:center;justify-content:center;">
    <h1 style="font-family:'Cinzel';color:#fff;font-size:36px;letter-spacing:3px;">Roulette</h1>
    <p style="font-family:'Cormorant Garamond';color:var(--text-secondary);font-size:18px;margin-top:8px;font-style:italic;">Roulette Américaine</p>
  </div>

  <div style="max-width:1100px;margin:0 auto;padding:32px 24px;">
    <a href="#/lobby" style="color:var(--text-muted);font-family:'Jost';font-size:13px;text-decoration:none;">← Retour au Lobby</a>
    
    <div class="jackpot-badge" style="margin-top:16px;">
      <span>♦</span>
      <span>Jackpot : <strong>${formatCoins(jackpotCurrent)}</strong></span>
      <span style="color:#5A5040;">—</span>
      <span style="color:#5A5040;">Numéro 7</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:32px;margin-top:24px;" id="roulette-grid">
      
      <!-- COLONNE GAUCHE : Roue + résultat -->
      <div class="card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:360px;">
        <div id="roulette-container">
          <!-- Roue SVG -->
          <svg id="svg-wheel" viewBox="0 0 200 200" style="width:100%;height:100%;transform-origin:center;transition:transform 3s cubic-bezier(0.1, 0.8, 0.1, 1);">
            <!-- Cercle de fond sombre -->
            <circle cx="100" cy="100" r="98" fill="#0c0c0c" stroke="#C9A84C" stroke-width="3"/>
            
            <g id="svg-slices"></g>
            
            <!-- Piste de la bille intérieure dorée -->
            <circle cx="100" cy="100" r="68" fill="none" stroke="#C9A84C" stroke-width="1" opacity="0.3"/>
            
            <!-- Cœur central doré -->
            <circle cx="100" cy="100" r="24" fill="#111" stroke="#C9A84C" stroke-width="1.5"/>
            <text x="100" y="104" font-family="Cinzel" font-size="14" fill="#C9A84C" text-anchor="middle" dominant-baseline="middle">♦</text>
          </svg>
          
          <!-- Bille séparée -->
          <svg id="svg-ball-container" viewBox="0 0 200 200" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;transform-origin:center;transition:transform 3s cubic-bezier(0.1, 0.85, 0.25, 1);">
            <circle id="svg-ball" cx="100" cy="14" r="5" fill="#fff" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));"/>
          </svg>
        </div>
        <div id="roulette-result" style="margin-top:28px;text-align:center;">
          <p style="font-family:'Cormorant Garamond';color:var(--text-muted);font-size:16px;">Placez votre mise et lancez</p>
        </div>
      </div>

      <!-- COLONNE DROITE : Contrôles -->
      <div class="card">
        <h3 style="font-family:'Cinzel';color:var(--gold-primary);font-size:18px;margin-bottom:20px;">Placer une mise</h3>
        
        <div style="margin-bottom:16px;">
          <label style="font-family:'Jost';color:var(--text-secondary);font-size:13px;display:block;margin-bottom:6px;">
            Mise (coins) — minimum ${minBet} coins
          </label>
          <input id="roulette-bet" type="number" min="${minBet}" max="${currentProfile?.balance_coins||0}"
            value="${minBet}" class="input-gold" oninput="updateRouletteInfo()">
          <div style="display:flex;gap:8px;margin-top:8px;">
            <button onclick="setBetValue(${minBet})" class="btn-outline-gold" style="padding:5px 12px;font-size:12px;">Min</button>
            <button onclick="setBetValue(Math.min(document.getElementById('roulette-bet').value*2,${currentProfile?.balance_coins||0}))" class="btn-outline-gold" style="padding:5px 12px;font-size:12px;">×2</button>
            <button onclick="setBetValue(${currentProfile?.balance_coins||0})" class="btn-outline-gold" style="padding:5px 12px;font-size:12px;">Max</button>
          </div>
        </div>

        <div id="roulette-cost-info" style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.2);
          border-radius:6px;padding:10px 14px;margin-bottom:18px;">
          <p style="font-family:'Cormorant Garamond';color:var(--gold-primary);font-size:15px;">
            Vous dépensez <strong id="bet-display">${minBet}</strong> coins pour cette partie.
          </p>
        </div>

        <!-- Simples chances -->
        <p style="font-family:'Jost';color:var(--text-muted);font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Simples chances</p>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
          ${betBtn('red','Rouge','#8B0000')}
          ${betBtn('black','Noir','#1a1a1a')}
          ${betBtn('odd','Pair','transparent')}
          ${betBtn('even','Impair','transparent')}
          ${betBtn('low','1–18','transparent')}
          ${betBtn('high','19–36','transparent')}
        </div>

        <!-- Douzaines -->
        <p style="font-family:'Jost';color:var(--text-muted);font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Douzaines (×3)</p>
        <div style="display:flex;gap:8px;margin-bottom:16px;">
          ${betBtn('dozen1','1–12','transparent')}
          ${betBtn('dozen2','13–24','transparent')}
          ${betBtn('dozen3','25–36','transparent')}
        </div>

        <!-- Plein -->
        <details style="margin-bottom:20px;">
          <summary style="font-family:'Jost';color:var(--text-muted);font-size:12px;text-transform:uppercase;letter-spacing:1px;cursor:pointer;margin-bottom:10px;">Numéro plein (×36)</summary>
          <div style="display:flex;flex-wrap:wrap;gap:4px;padding-top:10px;">${numbersGrid}</div>
        </details>

        <button id="btn-spin" onclick="spinRoulette()" class="btn-gold" style="width:100%;padding:14px;font-size:15px;letter-spacing:1px;">
          LANCER
        </button>
      </div>
    </div>
  </div>`);
  
  generateRouletteSlices();
  selectBet('red');
}

function betBtn(type, label, bg) {
  return `<button onclick="selectBet('${type}')" data-bet="${type}"
    style="padding:8px 16px;font-family:'Jost';font-size:13px;cursor:pointer;border-radius:5px;
    background:${bg};border:1px solid rgba(201,168,76,0.4);color:var(--text-primary);transition:all 0.2s;">
    ${label}</button>`;
}

function selectBet(type) {
  selectedBet = type;
  document.querySelectorAll('[data-bet]').forEach(btn => {
    btn.style.borderColor = btn.dataset.bet === type ? 'var(--gold-primary)' : 'rgba(201,168,76,0.3)';
    btn.style.boxShadow = btn.dataset.bet === type ? '0 0 8px rgba(201,168,76,0.3)' : 'none';
  });
}

function setBetValue(val) {
  document.getElementById('roulette-bet').value = Math.round(Math.max(0, val));
  updateRouletteInfo();
}

function updateRouletteInfo() {
  const val = document.getElementById('roulette-bet').value;
  const el = document.getElementById('bet-display');
  if (el) el.textContent = val;
}

async function spinRoulette() {
  if (rouletteSpinning) return;
  const betEl = document.getElementById('roulette-bet');
  const bet = parseInt(betEl.value);
  const settings = await getSettings();
  const minBet = parseInt(settings.roulette_min_bet || '5');

  if (isNaN(bet) || bet < minBet) { toastError(`Mise minimum : ${minBet} coins.`); return; }
  if (bet > currentProfile.balance_coins) { toastError('Solde insuffisant. Rechargez votre compte depuis le Portefeuille.'); return; }

  rouletteSpinning = true;
  document.getElementById('btn-spin').disabled = true;
  document.getElementById('btn-spin').textContent = 'En cours...';

  // Réinitialiser les animations et les styles d'illumination précédents
  const wheel = document.getElementById('svg-wheel');
  const ballContainer = document.getElementById('svg-ball-container');
  const ball = document.getElementById('svg-ball');
  
  // Éteindre l'ancien segment gagnant
  document.querySelectorAll('[id^="slice-"]').forEach(s => s.style.filter = 'none');
  
  // Enlever la classe de spiralisation pour pouvoir la remettre
  ball.classList.remove('ball-spinning');
  
  // Reset angles sans transition
  wheel.style.transition = 'none';
  ballContainer.style.transition = 'none';
  wheel.style.transform = 'rotate(0deg)';
  ballContainer.style.transform = 'rotate(0deg)';
  
  // Attendre un court instant pour appliquer la réinitialisation
  await new Promise(r => setTimeout(r, 50));
  
  // Rétablir les transitions pour la rotation
  wheel.style.transition = 'transform 3s cubic-bezier(0.1, 0.8, 0.1, 1)';
  ballContainer.style.transition = 'transform 3s cubic-bezier(0.1, 0.85, 0.25, 1)';
  
  // Activer la spiralisation de la bille
  ball.classList.add('ball-spinning');

  // Tirage réel (American Roulette)
  let result = ROULETTE_WHEEL[Math.floor(Math.random() * 38)];
  let won    = checkWin(selectedBet, result);

  // Boost Royal Modéré pour donner un léger coup de pouce très naturel
  let boostChance = 0;
  if (selectedBet.startsWith('num_')) {
    boostChance = 0.01; // 1% de coup de pouce pour les numéros pleins (très rare mais excitant)
  } else if (selectedBet.startsWith('dozen')) {
    boostChance = 0.04; // 4% de coup de pouce pour les douzaines
  } else {
    boostChance = 0.05; // 5% de coup de pouce pour les chances simples (rouge/noir, pair/impair...)
  }

  if (!won && Math.random() < boostChance) {
    const winningNumbers = ROULETTE_WHEEL.filter(n => checkWin(selectedBet, n));
    if (winningNumbers.length > 0) {
      result = winningNumbers[Math.floor(Math.random() * winningNumbers.length)];
      won = true;
    }
  }

  const winningIndex = AMERICAN_ORDER.indexOf(result);
  const anglePerSlice = 360 / 38;
  const sliceCenterAngle = winningIndex * anglePerSlice + anglePerSlice / 2;
  
  // Rotation de la roue (dans le sens horaire)
  const wheelTours = 3;
  const wheelExtraAngle = Math.random() * 360;
  const W_end = wheelTours * 360 + wheelExtraAngle;
  
  // Position finale de la tranche gagnante à l'écran (modulo 360)
  const targetAngle360 = (sliceCenterAngle + W_end) % 360;
  
  // Rotation de la bille (dans le sens anti-horaire)
  const ballTours = 4;
  const B_end = -ballTours * 360 + targetAngle360;
  
  // Déclencher les animations
  wheel.style.transform = `rotate(${W_end}deg)`;
  ballContainer.style.transform = `rotate(${B_end}deg)`;

  // Attendre la fin du spin (3 secondes)
  await new Promise(r => setTimeout(r, 3050));

  // Illumination du segment gagnant
  const winningSlice = document.getElementById(`slice-${result}`);
  if (winningSlice) {
    winningSlice.style.filter = 'brightness(1.5)';
  }

  const payout = getPayout(selectedBet);
  const gainCoins = won ? bet * payout : 0;
  const netCoins  = won ? bet * (payout - 1) : -bet;
  const colorStr  = getColor(result);
  const desc = `${selectedBet} → ${result} (${colorStr}) — ${won ? 'Victoire' : 'Défaite'}`;

  try {
    await processGame(currentProfile.id, currentProfile.username, 'roulette', bet, gainCoins, netCoins, desc);
    await refreshProfile();
    await incrementJackpot();
    await checkRouletteJackpot(result);
    await checkExplorerBonus();
    const colorHex = colorStr==='red'?'#f87171':colorStr==='green'?'#4ade80':'var(--text-secondary)';
    document.getElementById('roulette-result').innerHTML = `
      <div style="font-family:'Cormorant Garamond';font-size:48px;font-weight:700;color:${colorHex};">${result}</div>
      <div style="font-family:'Jost';color:${colorStr==='green'?'#4ade80':colorStr==='red'?'#fca5a5':'var(--text-secondary)'};font-size:14px;margin-top:4px;text-transform:capitalize;">${colorStr}</div>
      <div style="font-family:'Cormorant Garamond';font-size:18px;color:${won?'#4ade80':'#f87171'};margin-top:12px;">
        ${won ? `✨ Gagné ! +${gainCoins} coins` : `Perdu — ${bet} coins`}
      </div>`;
    won ? toastSuccess(`✨ Gagné ! +${gainCoins} coins`) : toastError(`Perdu — ${bet} coins`);
  } catch(e) {
    toastError('Erreur lors de la partie. Vérifiez votre solde.');
  }

  rouletteSpinning = false;
  document.getElementById('btn-spin').disabled = false;
  document.getElementById('btn-spin').textContent = 'LANCER';
}
