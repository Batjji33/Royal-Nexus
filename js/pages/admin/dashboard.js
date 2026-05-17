async function renderAdminDashboard() {
  render(adminLayout('#/admin', spinnerHTML()));

  const profiles = await getAllProfiles(); // Returns only non-admins
  const nonAdminIds = new Set(profiles.map(p => p.id));
  
  const allCoinOrders = await getCoinOrders();
  const coinOrders = allCoinOrders.filter(o => nonAdminIds.has(o.user_id));
  
  const allWithdrawals = await getWithdrawals();
  const withdrawals = allWithdrawals.filter(w => nonAdminIds.has(w.user_id));
  
  const allSessions = await getGameSessions();
  const sessions = allSessions.filter(s => nonAdminIds.has(s.user_id));

  const totalPlayers = profiles.length;
  
  // Calculate total coins in circulation ONLY for non-admin players to exclude admin's testing balance
  const totalCoins = profiles.reduce((sum, p) => sum + Number(p.balance_coins || 0), 0);
  
  const pendingPurchases = coinOrders.filter(o => o.status === 'pending');
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  const totalPending = pendingPurchases.length + pendingWithdrawals.length;

  const today = new Date().toISOString().split('T')[0];
  const sessionsToday = sessions.filter(s => s.created_at.startsWith(today)).length;

  const html = `
    <h1 style="font-family:'Cinzel';color:var(--gold-primary);font-size:28px;margin-bottom:32px;">Tableau de bord</h1>

    ${totalPending > 0 ? `
      <div style="background:rgba(180,130,0,0.15);border:1px solid rgba(180,130,0,0.3);border-radius:8px;padding:16px 24px;margin-bottom:32px;display:flex;align-items:center;justify-content:space-between;">
        <span style="font-family:'Jost';color:#E2C97E;">${totalPending} demande(s) en attente de validation</span>
        <div style="display:flex;gap:12px;">
          ${pendingPurchases.length > 0 ? `<button onclick="navigatePage('#/admin/purchases')" class="btn-outline-gold" style="padding:6px 16px;font-size:13px;">Gérer les achats →</button>` : ''}
          ${pendingWithdrawals.length > 0 ? `<button onclick="navigatePage('#/admin/withdrawals')" class="btn-outline-gold" style="padding:6px 16px;font-size:13px;">Gérer les retraits →</button>` : ''}
        </div>
      </div>
    ` : ''}

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px;margin-bottom:40px;">
      <div class="card" style="padding:20px;">
        <p style="font-family:'Jost';color:var(--text-muted);font-size:13px;text-transform:uppercase;">Joueurs</p>
        <p style="font-family:'Cormorant Garamond';color:var(--text-primary);font-size:32px;font-weight:700;margin-top:8px;">${totalPlayers}</p>
      </div>
      <div class="card" style="padding:20px;">
        <p style="font-family:'Jost';color:var(--text-muted);font-size:13px;text-transform:uppercase;">Coins en circulation</p>
        <p style="font-family:'Cormorant Garamond';color:var(--text-primary);font-size:32px;font-weight:700;margin-top:8px;">${formatCoins(totalCoins)}</p>
        <p style="font-family:'Jost';color:var(--gold-dark);font-size:13px;margin-top:4px;">${formatEuros(totalCoins)}</p>
      </div>
      <div class="card" style="padding:20px;">
        <p style="font-family:'Jost';color:var(--text-muted);font-size:13px;text-transform:uppercase;">Demandes en attente</p>
        <p style="font-family:'Cormorant Garamond';color:${totalPending>0?'#f87171':'var(--text-primary)'};font-size:32px;font-weight:700;margin-top:8px;">${totalPending}</p>
      </div>
      <div class="card" style="padding:20px;">
        <p style="font-family:'Jost';color:var(--text-muted);font-size:13px;text-transform:uppercase;">Parties aujourd'hui</p>
        <p style="font-family:'Cormorant Garamond';color:var(--text-primary);font-size:32px;font-weight:700;margin-top:8px;">${sessionsToday}</p>
      </div>
    </div>

    <div class="card" style="padding:0;overflow:hidden;">
      <div style="padding:20px;border-bottom:1px solid rgba(201,168,76,0.15);display:flex;justify-content:space-between;align-items:center;">
        <h3 style="font-family:'Cinzel';color:var(--gold-primary);font-size:16px;">Activité récente (10 dernières parties)</h3>
        <button id="btn-reset-stats" onclick="confirmResetStats()" class="btn-outline-gold" style="padding:5px 12px;font-size:11px;border-color:#f87171;color:#f87171;">
          Réinitialiser les stats
        </button>
      </div>
      <div style="overflow-x:auto;">
        <table class="table-royal">
          <thead><tr><th>Joueur</th><th>Jeu</th><th>Mise</th><th>Résultat</th><th>Net</th><th>Date</th></tr></thead>
          <tbody>
            ${sessions.slice(0, 10).map(s => {
              const gameNames = { roulette: 'Roulette', slots: 'Machine à Sous', crash: 'Crash' };
              const netColor = s.net_coins > 0 ? '#4ade80' : s.net_coins < 0 ? '#f87171' : 'var(--text-secondary)';
              const sign = s.net_coins > 0 ? '+' : '';
              return `
              <tr>
                <td style="font-weight:500;">${s.username}</td>
                <td>${gameNames[s.game_type] || s.game_type}</td>
                <td>${s.bet_coins}</td>
                <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.result_description}</td>
                <td style="color:${netColor};font-weight:500;">${sign}${s.net_coins}</td>
                <td style="color:var(--text-muted);font-size:12px;">${formatDate(s.created_at)}</td>
              </tr>
              `;
            }).join('')}
            ${sessions.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">Aucune activité récente</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </div>
  `;

  render(adminLayout('#/admin', html));
}

let resetState = 0;
let resetTimeout = null;

async function confirmResetStats() {
  const btn = document.getElementById('btn-reset-stats');
  if (!btn) return;

  if (resetState === 0) {
    resetState = 1;
    btn.textContent = '⚠️ Confirmer ?';
    btn.style.backgroundColor = 'rgba(248,113,113,0.1)';
    btn.style.borderColor = '#ef4444';
    btn.style.color = '#ef4444';
    
    resetTimeout = setTimeout(() => {
      resetState = 0;
      btn.textContent = 'Réinitialiser les stats';
      btn.style.backgroundColor = 'transparent';
      btn.style.borderColor = '#f87171';
      btn.style.color = '#f87171';
    }, 4000);
  } else {
    clearTimeout(resetTimeout);
    resetState = 0;
    btn.disabled = true;
    btn.textContent = 'Réinitialisation...';
    
    try {
      await resetGameSessions();
      toastSuccess('✅ Toutes les statistiques ont été réinitialisées.');
      await renderAdminDashboard();
    } catch(e) {
      toastError('Erreur de réinitialisation.');
      btn.disabled = false;
      btn.textContent = 'Réinitialiser les stats';
      btn.style.backgroundColor = 'transparent';
      btn.style.borderColor = '#f87171';
      btn.style.color = '#f87171';
    }
  }
}
