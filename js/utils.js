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

  await db.rpc('add_coins', { target_user_id: currentUser.id, amount });
  await db.from('profiles')
    .update({ explorer_bonus_last_claimed: new Date().toISOString() })
    .eq('id', currentUser.id);

  await refreshProfile();
  showExplorerBonusModal(amount);
}

function showExplorerBonusModal(amount) {
  const symbols = ['♦','★','✦','◆','✧'];
  const particles = Array.from({ length: 25 }, (_, i) => {
    const left = Math.random() * 100;
    const duration = 2.5 + Math.random() * 3;
    const delay = Math.random() * 2;
    const size = 14 + Math.floor(Math.random() * 16);
    const sym = symbols[Math.floor(Math.random() * symbols.length)];
    return `<span class="explorer-particle" style="
      left:${left}vw;
      font-size:${size}px;
      animation-duration:${duration}s;
      animation-delay:${delay}s;
      color:#C9A84C;
      opacity:.8;
    ">${sym}</span>`;
  }).join('');

  const modal = document.createElement('div');
  modal.id = 'explorer-modal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.93);
    z-index:9999;display:flex;align-items:center;
    justify-content:center;padding:20px;
  `;

  modal.innerHTML = `
    ${particles}
    <div style="
      text-align:center;
      animation: fadeInScale .5s ease forwards;
      position:relative;z-index:10000;
      max-width:480px;width:100%;
    ">
      <div style="
        font-family:'Cinzel';font-size:80px;color:#C9A84C;
        animation: pulse-gold 2s ease infinite;
        line-height:1;margin-bottom:16px;
      ">♦</div>

      <h2 style="
        font-family:'Cinzel';color:#C9A84C;
        font-size:clamp(24px,5vw,38px);
        letter-spacing:3px;margin-bottom:12px;
      ">BONUS EXPLORER</h2>

      <p style="
        font-family:'Cormorant Garamond';font-style:italic;
        color:#A89A7A;font-size:clamp(15px,2.5vw,20px);
        margin-bottom:24px;
      ">Vous avez exploré tous les jeux Royal Nexus aujourd'hui !</p>

      <div style="
        font-family:'Cormorant Garamond';font-weight:700;
        font-size:clamp(40px,8vw,64px);color:#C9A84C;
        margin-bottom:8px;
      ">+${amount} coins</div>

      <p style="
        font-family:'Jost';color:#5A5040;font-size:13px;
        margin-bottom:28px;
      ">Ce bonus est disponible chaque jour. Revenez demain !</p>

      <button onclick="closeExplorerModal()" style="
        background:linear-gradient(135deg,#C9A84C,#8B6914);
        color:#080808;font-family:'Jost';font-weight:700;
        padding:14px 36px;border:none;border-radius:6px;
        cursor:pointer;font-size:15px;letter-spacing:1px;
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
