// Formatage
function formatCoins(n) { return `${Number(n).toLocaleString('fr-FR')} coins`; }
function formatEuros(n) { 
  const rate = window.coinsPerEuro || 10;
  return `${(Number(n) / rate).toFixed(2)} €`; 
}
function formatDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// Toasts
function toast(msg, type = 'info') {
  const backgrounds = { success: '#2D7A3A', error: '#8B0000', info: '#8B6914' };
  Toastify({
    text: msg, duration: 3500, gravity: 'top', position: 'right',
    style: { background: backgrounds[type] || backgrounds.info, fontFamily: 'Jost', borderRadius: '6px' }
  }).showToast();
}
function toastSuccess(msg) { toast(msg, 'success'); }
function toastError(msg) { toast(msg, 'error'); }
function toastInfo(msg) { toast(msg, 'info'); }

// Badge statut
function statusBadge(status) {
  const labels = { pending: 'En attente', accepted: 'Accepté', refused: 'Refusé' };
  return `<span class="badge-${status}">${labels[status] || status}</span>`;
}

// Spinner
function spinnerHTML() {
  return `<div style="display:flex;justify-content:center;align-items:center;padding:40px;">
    <div class="spinner"></div>
  </div>`;
}

// Erreurs Supabase → français
function translateError(msg) {
  const map = {
    'Invalid login credentials': 'Email ou mot de passe incorrect',
    'User already registered': 'Un compte existe déjà avec cet email',
    'Email not confirmed': 'Veuillez confirmer votre adresse email',
    'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères',
    'duplicate key value violates unique constraint "profiles_username_key"': 'Ce nom d\'utilisateur est déjà utilisé',
  };
  for (const [k, v] of Object.entries(map)) {
    if (msg.includes(k)) return v;
  }
  return msg;
}

// Monter une page dans #app
function render(html) {
  document.getElementById('app').innerHTML = html;
}

// ==========================================
// BONUS EXPLORER QUOTIDIEN
// ==========================================

async function checkExplorerBonus() {
  if (!currentUser || !currentProfile) return;

  const last = currentProfile.explorer_bonus_last_claimed;
  if (last) {
    const lastDate = new Date(last).toDateString();
    const today = new Date().toDateString();
    if (lastDate === today) return;
  }

  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const iso = todayStart.toISOString();

  const { data: sessions } = await db
    .from('game_sessions')
    .select('game_type')
    .eq('user_id', currentUser.id)
    .gte('created_at', iso);

  if (!sessions) return;

  const count = { roulette: 0, slots: 0, crash: 0 };
  sessions.forEach(s => { if (count[s.game_type] !== undefined) count[s.game_type]++; });

  if (count.roulette >= 5 && count.slots >= 5 && count.crash >= 5) {
    await triggerExplorerBonus();
  }
}

async function triggerExplorerBonus() {
  const settings = await getSettings();
  const amount = parseInt(settings.explorer_bonus_amount || '50');
  const isLucky = settings.explorer_bonus_lucky_day === 'true';

  await db.rpc('add_coins', { target_user_id: currentUser.id, amount });
  await db.from('profiles')
    .update({ explorer_bonus_last_claimed: new Date().toISOString() })
    .eq('id', currentUser.id);

  await refreshProfile();
  showExplorerBonusModal(amount, isLucky);
}

function showExplorerBonusModal(amount, isLucky = false) {
  const symbols = isLucky ? ['🍀','✨','❇️','⭐','💰','✦'] : ['♦','★','✦','◆','✧'];
  const particleColor = isLucky ? '#4ade80' : '#C9A84C';
  const particles = Array.from({ length: 35 }, (_, i) => {
    const left = Math.random() * 100;
    const duration = 2.5 + Math.random() * 3;
    const delay = Math.random() * 2;
    const size = 14 + Math.floor(Math.random() * 18);
    const sym = symbols[Math.floor(Math.random() * symbols.length)];
    return `<span class="explorer-particle" style="
      left:${left}vw;
      font-size:${size}px;
      animation-duration:${duration}s;
      animation-delay:${delay}s;
      color:${sym === '🍀' ? '#4ade80' : particleColor};
      text-shadow: ${isLucky ? '0 0 8px rgba(74, 222, 128, 0.4)' : 'none'};
      opacity:.85;
    ">${sym}</span>`;
  }).join('');

  const modal = document.createElement('div');
  modal.id = 'explorer-modal';
  modal.style.cssText = `
    position:fixed;inset:0;
    background:${isLucky ? 'radial-gradient(circle, rgba(6,30,12,0.98) 0%, rgba(3,5,3,0.99) 100%)' : 'rgba(0,0,0,.93)'};
    z-index:9999;display:flex;align-items:center;
    justify-content:center;padding:20px;
    box-shadow: ${isLucky ? 'inset 0 0 100px rgba(74,222,128,0.15)' : 'none'};
  `;

  const luckyHeader = isLucky ? `
    <div style="
      display:inline-block;
      background:linear-gradient(135deg, #16a34a, #4ade80);
      color:#fff;
      font-family:'Jost';
      font-size:13px;
      font-weight:700;
      letter-spacing:2px;
      padding:6px 16px;
      border-radius:50px;
      margin-bottom:20px;
      box-shadow: 0 0 15px rgba(74,222,128,0.4);
      animation: pulse-green 1.5s ease-in-out infinite;
    ">
      🍀 JOUR DE CHANCE ACTIVÉ 🍀
    </div>
  ` : '';

  const titleColor = isLucky ? '#4ade80' : '#C9A84C';
  const subtitleColor = isLucky ? '#86efac' : '#A89A7A';
  const amountShadow = isLucky ? '0 0 30px rgba(74,222,128,0.5)' : 'none';

  modal.innerHTML = `
    <style>
      @keyframes pulse-green {
        0% { transform: scale(1); filter: brightness(1); }
        50% { transform: scale(1.05); filter: brightness(1.2); }
        100% { transform: scale(1); filter: brightness(1); }
      }
      @keyframes scale-up-pulse {
        from { transform: scale(1); }
        to { transform: scale(1.08); }
      }
    </style>
    ${particles}
    <div style="
      text-align:center;
      animation: fadeInScale .5s ease forwards;
      position:relative;z-index:10000;
      max-width:480px;width:100%;
    ">
      ${luckyHeader}
      
      <div style="
        font-family:'Cinzel';font-size:80px;color:${titleColor};
        animation: ${isLucky ? 'pulse-green' : 'pulse-gold'} 2s ease infinite;
        line-height:1;margin-bottom:16px;
      ">${isLucky ? '🍀' : '♦'}</div>

      <h2 style="
        font-family:'Cinzel';color:${titleColor};
        font-size:clamp(24px,5vw,38px);
        letter-spacing:3px;margin-bottom:12px;
      ">BONUS EXPLORER</h2>

      <p style="
        font-family:'Cormorant Garamond';font-style:italic;
        color:${subtitleColor};font-size:clamp(15px,2.5vw,20px);
        margin-bottom:24px;
        line-height:1.4;
      ">
        ${isLucky 
          ? 'La chance sourit aux audacieux ! Vos explorations ont réveillé les trèfles magiques du casino aujourd\'hui.' 
          : 'Vous avez exploré tous les jeux Royal Nexus aujourd\'hui !'}
      </p>

      <div style="
        font-family:'Cormorant Garamond';font-weight:700;
        font-size:clamp(40px,8vw,64px);color:${titleColor};
        text-shadow: ${amountShadow};
        margin-bottom:8px;
        animation: ${isLucky ? 'scale-up-pulse 1s ease-in-out infinite alternate' : 'none'};
      ">+${amount} coins</div>

      <p style="
        font-family:'Jost';color:${isLucky ? '#4ade80' : '#5A5040'};font-size:13px;
        margin-bottom:28px;
        font-weight: ${isLucky ? '600' : 'normal'};
      ">
        ${isLucky 
          ? '🍀 Montant boosté exceptionnellement pour célébrer ce jour de veine !' 
          : 'Ce bonus est disponible chaque jour. Revenez demain !'}
      </p>

      <button onclick="closeExplorerModal()" style="
        background:${isLucky ? 'linear-gradient(135deg,#22c55e,#4ade80)' : 'linear-gradient(135deg,#C9A84C,#8B6914)'};
        color:#080808;font-family:'Jost';font-weight:700;
        padding:14px 36px;border:none;border-radius:6px;
        cursor:pointer;font-size:15px;letter-spacing:1px;
        box-shadow: ${isLucky ? '0 0 15px rgba(34,197,94,0.4)' : 'none'};
      ">Récupérer mon bonus →</button>
    </div>
  `;

  document.body.appendChild(modal);

  setTimeout(() => closeExplorerModal(), 12000);
}

function closeExplorerModal() {
  const el = document.getElementById('explorer-modal');
  if (el) el.remove();
}

async function claimExplorerBonus() {
  await triggerExplorerBonus();
  renderLobby();
}
