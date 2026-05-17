async function renderAdminWithdrawals() {
  render(adminLayout('#/admin/withdrawals', spinnerHTML()));
  const withdrawals = await getWithdrawals();
  
  const filter = window.location.hash.includes('?filter=') ? window.location.hash.split('?filter=')[1] : 'all';
  
  const filteredWithdrawals = filter === 'all' ? withdrawals : withdrawals.filter(w => w.status === filter);

  const html = `
    <h1 style="font-family:'Cinzel';color:var(--gold-primary);font-size:28px;margin-bottom:32px;">Demandes de retrait</h1>
    
    <div style="display:flex;gap:12px;margin-bottom:24px;">
      <button onclick="navigatePage('#/admin/withdrawals?filter=all')" class="${filter==='all'?'btn-gold':'btn-outline-gold'}" style="padding:6px 16px;font-size:13px;">Toutes</button>
      <button onclick="navigatePage('#/admin/withdrawals?filter=pending')" class="${filter==='pending'?'btn-gold':'btn-outline-gold'}" style="padding:6px 16px;font-size:13px;">En attente</button>
      <button onclick="navigatePage('#/admin/withdrawals?filter=accepted')" class="${filter==='accepted'?'btn-gold':'btn-outline-gold'}" style="padding:6px 16px;font-size:13px;">Acceptées</button>
      <button onclick="navigatePage('#/admin/withdrawals?filter=refused')" class="${filter==='refused'?'btn-gold':'btn-outline-gold'}" style="padding:6px 16px;font-size:13px;">Refusées</button>
    </div>

    <div class="card" style="padding:0;overflow-x:auto;">
      <table class="table-royal">
        <thead><tr><th>Joueur</th><th>Coins</th><th>Montant €</th><th>Date</th><th>Statut</th><th>Actions</th></tr></thead>
        <tbody>
          ${filteredWithdrawals.map(w => `
            <tr>
              <td style="font-weight:500;">${w.username}</td>
              <td>${w.coins_amount}</td>
              <td>${w.euros_amount} €</td>
              <td style="color:var(--text-muted);font-size:12px;">${formatDate(w.created_at)}</td>
              <td>${statusBadge(w.status)}</td>
              <td>
                ${w.status === 'pending' ? `
                  <div style="display:flex;gap:8px;">
                    <button onclick="acceptWithdrawal('${w.id}', '${w.user_id}', '${w.username}', ${w.coins_amount}, ${w.euros_amount})" class="btn-success" style="padding:4px 10px;font-size:12px;">✓ Accepter</button>
                    <button onclick="refuseWithdrawal('${w.id}', '${w.username}')" class="btn-danger" style="padding:4px 10px;font-size:12px;">✕ Refuser</button>
                  </div>
                ` : '-'}
              </td>
            </tr>
          `).join('')}
          ${filteredWithdrawals.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">Aucune demande trouvée</td></tr>' : ''}
        </tbody>
      </table>
    </div>
  `;

  render(adminLayout('#/admin/withdrawals', html));
}

async function acceptWithdrawal(id, userId, username, coinsAmount, eurosAmount) {
  try {
    const profile = await getProfile(userId);
    if (profile.balance_coins < coinsAmount) {
      toastError(`Solde insuffisant pour ${username} (actuel: ${profile.balance_coins})`);
      return;
    }
    const deducted = await deductCoins(userId, coinsAmount);
    if (deducted) {
      await updateWithdrawalStatus(id, 'accepted');
      toastSuccess(`✅ Retrait validé. Effectuez un virement de ${eurosAmount}€ sur NexusBank à ${username}.`);
      renderAdminWithdrawals();
    } else {
      toastError("Erreur lors de la déduction.");
    }
  } catch(e) {
    toastError('Erreur lors de l\'acceptation');
  }
}

async function refuseWithdrawal(id, username) {
  try {
    await updateWithdrawalStatus(id, 'refused');
    toastInfo(`Demande de retrait de ${username} refusée`);
    renderAdminWithdrawals();
  } catch(e) {
    toastError('Erreur lors du refus');
  }
}
