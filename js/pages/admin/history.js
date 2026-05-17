async function renderAdminHistory() {
  render(adminLayout('#/admin/history', spinnerHTML()));
  
  const filter = window.location.hash.includes('?filter=') ? window.location.hash.split('?filter=')[1] : 'all';
  
  const allSessions = await getGameSessions();
  const sessions = filter === 'all' ? allSessions : allSessions.filter(s => s.game_type === filter);

  const totalMise = sessions.reduce((sum, s) => sum + s.bet_coins, 0);
  const totalRedistribue = sessions.reduce((sum, s) => sum + s.gain_coins, 0);
  const profitMaison = totalMise - totalRedistribue;
  const profitPercent = totalMise > 0 ? ((profitMaison / totalMise) * 100).toFixed(1) : 0;

  const html = `
    <h1 style="font-family:'Cinzel';color:var(--gold-primary);font-size:28px;margin-bottom:32px;">Historique global</h1>
    
    <div style="display:flex;gap:12px;margin-bottom:24px;">
      <button onclick="navigatePage('#/admin/history?filter=all')" class="${filter==='all'?'btn-gold':'btn-outline-gold'}" style="padding:6px 16px;font-size:13px;">Tous</button>
      <button onclick="navigatePage('#/admin/history?filter=roulette')" class="${filter==='roulette'?'btn-gold':'btn-outline-gold'}" style="padding:6px 16px;font-size:13px;">Roulette</button>
      <button onclick="navigatePage('#/admin/history?filter=slots')" class="${filter==='slots'?'btn-gold':'btn-outline-gold'}" style="padding:6px 16px;font-size:13px;">Machine à Sous</button>
      <button onclick="navigatePage('#/admin/history?filter=crash')" class="${filter==='crash'?'btn-gold':'btn-outline-gold'}" style="padding:6px 16px;font-size:13px;">Crash</button>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px;margin-bottom:32px;">
      <div class="card" style="padding:20px;">
        <p style="font-family:'Jost';color:var(--text-muted);font-size:13px;text-transform:uppercase;">Total misé</p>
        <p style="font-family:'Cormorant Garamond';color:var(--text-primary);font-size:28px;font-weight:700;margin-top:8px;">${totalMise}</p>
      </div>
      <div class="card" style="padding:20px;">
        <p style="font-family:'Jost';color:var(--text-muted);font-size:13px;text-transform:uppercase;">Total redistribué</p>
        <p style="font-family:'Cormorant Garamond';color:var(--text-primary);font-size:28px;font-weight:700;margin-top:8px;">${totalRedistribue}</p>
      </div>
      <div class="card" style="padding:20px;">
        <p style="font-family:'Jost';color:var(--text-muted);font-size:13px;text-transform:uppercase;">Profit maison</p>
        <p style="font-family:'Cormorant Garamond';color:${profitMaison >= 0 ? '#4ade80' : '#f87171'};font-size:28px;font-weight:700;margin-top:8px;">${profitMaison >= 0 ? '+' : ''}${profitMaison}</p>
      </div>
      <div class="card" style="padding:20px;">
        <p style="font-family:'Jost';color:var(--text-muted);font-size:13px;text-transform:uppercase;">Marge bénéficiaire</p>
        <p style="font-family:'Cormorant Garamond';color:var(--gold-primary);font-size:28px;font-weight:700;margin-top:8px;">${profitPercent}%</p>
      </div>
    </div>

    <div class="card" style="padding:0;overflow-x:auto;">
      <table class="table-royal">
        <thead><tr><th>Joueur</th><th>Jeu</th><th>Mise</th><th>Résultat</th><th>Gain/Perte</th><th>Date</th></tr></thead>
        <tbody>
          ${sessions.map(s => {
            const gameNames = { roulette: 'Roulette', slots: 'Machine à Sous', crash: 'Crash' };
            const netColor = s.net_coins > 0 ? '#4ade80' : s.net_coins < 0 ? '#f87171' : 'var(--text-secondary)';
            const sign = s.net_coins > 0 ? '+' : '';
            return `
            <tr>
              <td style="font-weight:500;">${s.username}</td>
              <td>${gameNames[s.game_type] || s.game_type}</td>
              <td>${s.bet_coins}</td>
              <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${s.result_description}">${s.result_description}</td>
              <td style="color:${netColor};font-weight:500;">${sign}${s.net_coins}</td>
              <td style="color:var(--text-muted);font-size:12px;">${formatDate(s.created_at)}</td>
            </tr>
            `;
          }).join('')}
          ${sessions.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">Aucune partie trouvée</td></tr>' : ''}
        </tbody>
      </table>
    </div>
  `;

  render(adminLayout('#/admin/history', html));
}
