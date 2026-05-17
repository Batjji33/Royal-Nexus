async function renderAdminPlayers() {
  render(adminLayout('#/admin/players', spinnerHTML()));
  const profiles = await getAllProfiles();
  const settings = await getSettings();
  const coinsPerEuro = parseFloat(settings.coins_per_euro || '10');

  const html = `
    <h1 style="font-family:'Cinzel';color:var(--gold-primary);font-size:28px;margin-bottom:32px;">Gestion des joueurs</h1>
    
    <div class="card" style="padding:0;overflow-x:auto;">
      <table class="table-royal">
        <thead><tr><th>Username</th><th>Solde coins</th><th>Solde €</th><th>Membre depuis</th><th>Actions</th></tr></thead>
        <tbody>
          ${profiles.map(p => `
            <tr>
              <td style="font-weight:500;">${p.username}</td>
              <td>${p.balance_coins}</td>
              <td>${(p.balance_coins / coinsPerEuro).toFixed(2)} €</td>
              <td style="color:var(--text-muted);font-size:12px;">${formatDate(p.created_at)}</td>
              <td>
                <div style="display:flex;gap:8px;">
                  <button onclick="promptAjusterSolde('${p.id}', '${p.username}', ${p.balance_coins})" class="btn-outline-gold" style="padding:4px 10px;font-size:12px;">Ajuster Solde</button>
                </div>
              </td>
            </tr>
          `).join('')}
          ${profiles.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);">Aucun joueur trouvé</td></tr>' : ''}
        </tbody>
      </table>
    </div>

    <!-- Modale Ajuster Solde -->
    <div id="modal-ajuster" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:999;align-items:center;justify-content:center;">
      <div class="card" style="width:100%;max-width:400px;background:#161616;">
        <h3 style="font-family:'Cinzel';color:var(--gold-primary);font-size:18px;margin-bottom:16px;" id="modal-title">Ajuster le solde</h3>
        <p style="font-family:'Jost';color:var(--text-secondary);font-size:14px;margin-bottom:16px;" id="modal-desc"></p>
        <input type="number" id="modal-input" class="input-gold" min="0" step="1">
        <div style="display:flex;gap:12px;margin-top:24px;">
          <button onclick="closeModalAjuster()" class="btn-outline-gold" style="flex:1;">Annuler</button>
          <button id="modal-confirm" class="btn-gold" style="flex:1;">Confirmer</button>
        </div>
      </div>
    </div>
  `;

  render(adminLayout('#/admin/players', html));
}

function promptAjusterSolde(userId, username, currentBalance) {
  const modal = document.getElementById('modal-ajuster');
  document.getElementById('modal-title').textContent = `Ajuster le solde de ${username}`;
  document.getElementById('modal-desc').textContent = `Solde actuel : ${currentBalance} coins`;
  document.getElementById('modal-input').value = currentBalance;
  
  document.getElementById('modal-confirm').onclick = async () => {
    const newVal = parseInt(document.getElementById('modal-input').value);
    if (isNaN(newVal) || newVal < 0) { toastError("Valeur invalide"); return; }
    try {
      await updateProfile(userId, { balance_coins: newVal });
      toastSuccess(`Solde de ${username} mis à jour : ${newVal} coins`);
      closeModalAjuster();
      renderAdminPlayers();
    } catch(e) {
      toastError("Erreur lors de la mise à jour");
    }
  };
  
  modal.style.display = 'flex';
}

function closeModalAjuster() {
  document.getElementById('modal-ajuster').style.display = 'none';
}
