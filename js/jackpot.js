// ============================================================
// JACKPOT — Fonctions principales
// ============================================================

let jackpotCurrent = 50; // cache local mis à jour en temps réel

async function loadJackpot() {
  const s = await getSettings();
  jackpotCurrent = parseInt(s.jackpot_current || '50');
  return jackpotCurrent;
}

// Appelée après chaque fin de partie
async function incrementJackpot() {
  if (isAdmin()) return;
  await db.rpc('increment_jackpot');
  jackpotCurrent = Math.min(jackpotCurrent + 1, 300);
  updateJackpotDisplays();
}

// Met à jour tous les affichages du jackpot sans reload
function updateJackpotDisplays() {
  document.querySelectorAll('.jackpot-value').forEach(el => {
    el.textContent = formatCoins(jackpotCurrent);
  });
  // Si on est sur une page avec le badge
  const badgeVal = document.querySelector('.jackpot-badge strong');
  if (badgeVal) {
    badgeVal.textContent = formatCoins(jackpotCurrent);
  }
}

// Vérification victoire Roulette (numéro 7)
async function checkRouletteJackpot(result) {
  if (isAdmin()) return;
  if (String(result) !== '7') return;
  await awardJackpot();
}

// Vérification victoire Slots (Lucky 7)
async function checkSlotsJackpot(symbolId) {
  if (isAdmin()) return;
  if (symbolId !== 'seven') return;
  await awardJackpot();
}

// Remporter le jackpot
async function awardJackpot() {
  try {
    const { data: amount } = await db.rpc('win_jackpot', {
      winner_id: currentUser.id,
      winner_name: currentProfile.username
    });
    await refreshProfile();
    jackpotCurrent = parseInt((await getSettings()).jackpot_seed || '50');
    updateJackpotDisplays();
    showJackpotModal(amount);
  } catch(e) {
    toastError('Erreur lors du jackpot.');
  }
}

// ============================================================
// MODAL JACKPOT — Animation plein écran
// ============================================================
function showJackpotModal(amount) {
  const symbols = ['♦','★','✦','◆','✧','♠','♣'];
  const particles = Array.from({ length: 40 }, () => {
    const left     = Math.random() * 100;
    const duration = 1.8 + Math.random() * 2.5;
    const delay    = Math.random() * 1.5;
    const size     = 14 + Math.floor(Math.random() * 20);
    const sym      = symbols[Math.floor(Math.random() * symbols.length)];
    return `<span class="jackpot-particle" style="
      left:${left}vw;
      font-size:${size}px;
      animation-duration:${duration}s;
      animation-delay:${delay}s;
    ">${sym}</span>`;
  }).join('');

  const modal = document.createElement('div');
  modal.id = 'jackpot-modal';
  modal.style.cssText = `
    position:fixed;inset:0;
    background:rgba(0,0,0,.95);
    z-index:9999;
    display:flex;align-items:center;justify-content:center;
    padding:20px;
  `;

  modal.innerHTML = `
    ${particles}
    <div style="
      text-align:center;
      animation: jackpotEntrance .6s ease forwards;
      position:relative;z-index:10000;
      max-width:520px;width:100%;
    ">
      <!-- Trophée pulsant -->
      <div style="
        font-family:'Cinzel',serif;
        font-size:90px;
        color:#C9A84C;
        animation: jackpotPulse 1.5s ease-in-out infinite;
        display:inline-block;
        line-height:1;
        margin-bottom:20px;
      ">♦</div>

      <!-- Titre -->
      <h1 style="
        font-family:'Cinzel',serif;
        font-size:clamp(32px,7vw,56px);
        font-weight:700;
        color:#C9A84C;
        letter-spacing:5px;
        margin-bottom:14px;
        text-shadow:0 0 40px rgba(201,168,76,.6);
      ">JACKPOT !</h1>

      <!-- Séparateur -->
      <div style="width:80px;height:1px;background:#C9A84C;margin:0 auto 20px;"></div>

      <!-- Sous-titre -->
      <p style="
        font-family:'Cormorant Garamond',serif;
        font-style:italic;
        font-size:clamp(16px,2.5vw,22px);
        color:#A89A7A;
        margin-bottom:28px;
      ">Le jackpot progressif est à vous !</p>

      <!-- Montant -->
      <div style="
        font-family:'Cormorant Garamond',serif;
        font-weight:700;
        font-size:clamp(48px,10vw,80px);
        color:#C9A84C;
        margin-bottom:10px;
        text-shadow:0 0 30px rgba(201,168,76,.5);
      ">+${amount} coins</div>

      <!-- Équivalent euros -->
      <p style="
        font-family:'Jost',sans-serif;
        color:#5A5040;
        font-size:14px;
        margin-bottom:8px;
      ">= ${(amount/10).toFixed(2)} € NexusBank</p>

      <!-- Note reset -->
      <p id="jackpot-seed-note" style="
        font-family:'Jost',sans-serif;
        color:#5A5040;
        font-size:13px;
        margin-bottom:32px;
      ">Le jackpot repart de ${jackpotCurrent} coins</p>

      <!-- Bouton -->
      <button onclick="closeJackpotModal()" style="
        background:linear-gradient(135deg,#C9A84C,#8B6914);
        color:#080808;
        font-family:'Jost',sans-serif;
        font-weight:700;
        padding:16px 44px;
        border:none;
        border-radius:8px;
        cursor:pointer;
        font-size:16px;
        letter-spacing:1px;
        transition:opacity .2s;
      ">Encaisser →</button>
    </div>
  `;

  document.body.appendChild(modal);
  setTimeout(() => closeJackpotModal(), 15000);
}

function closeJackpotModal() {
  const el = document.getElementById('jackpot-modal');
  if (el) el.remove();
}

// ============================================================
// REALTIME — Mise à jour en temps réel du jackpot
// ============================================================
function subscribeJackpot() {
  db.channel('jackpot-channel')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'settings',
      filter: 'key=eq.jackpot_current'
    }, payload => {
      jackpotCurrent = parseInt(payload.new.value || '50');
      updateJackpotDisplays();
    })
    .subscribe();
}
