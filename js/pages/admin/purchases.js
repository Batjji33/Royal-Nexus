async function renderAdminPurchases() {
  render(adminLayout('#/admin/purchases', spinnerHTML()));
  const orders = await getCoinOrders();
  
  const filter = window.location.hash.includes('?filter=') ? window.location.hash.split('?filter=')[1] : 'all';
  
  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const html = `
    <h1 style="font-family:'Cinzel';color:var(--gold-primary);font-size:28px;margin-bottom:32px;">Demandes d'achat de coins</h1>
    
    <div style="display:flex;gap:12px;margin-bottom:24px;">
      <button onclick="navigatePage('#/admin/purchases?filter=all')" class="${filter==='all'?'btn-gold':'btn-outline-gold'}" style="padding:6px 16px;font-size:13px;">Toutes</button>
      <button onclick="navigatePage('#/admin/purchases?filter=pending')" class="${filter==='pending'?'btn-gold':'btn-outline-gold'}" style="padding:6px 16px;font-size:13px;">En attente</button>
      <button onclick="navigatePage('#/admin/purchases?filter=accepted')" class="${filter==='accepted'?'btn-gold':'btn-outline-gold'}" style="padding:6px 16px;font-size:13px;">Acceptées</button>
      <button onclick="navigatePage('#/admin/purchases?filter=refused')" class="${filter==='refused'?'btn-gold':'btn-outline-gold'}" style="padding:6px 16px;font-size:13px;">Refusées</button>
    </div>

    <div class="card" style="padding:0;overflow-x:auto;">
      <table class="table-royal">
        <thead><tr><th>Joueur</th><th>Coins</th><th>Montant €</th><th>Date</th><th>Statut</th><th>Actions</th></tr></thead>
        <tbody>
          ${filteredOrders.map(o => `
            <tr>
              <td style="font-weight:500;">${o.username}</td>
              <td>${o.coins_amount}</td>
              <td>${o.euros_amount} €</td>
              <td style="color:var(--text-muted);font-size:12px;">${formatDate(o.created_at)}</td>
              <td>${statusBadge(o.status)}</td>
              <td>
                ${o.status === 'pending' ? `
                  <div style="display:flex;gap:8px;">
                    <button onclick="acceptPurchase('${o.id}', '${o.user_id}', '${o.username}', ${o.coins_amount})" class="btn-success" style="padding:4px 10px;font-size:12px;">✓ Accepter</button>
                    <button onclick="refusePurchase('${o.id}', '${o.username}')" class="btn-danger" style="padding:4px 10px;font-size:12px;">✕ Refuser</button>
                  </div>
                ` : '-'}
              </td>
            </tr>
          `).join('')}
          ${filteredOrders.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">Aucune demande trouvée</td></tr>' : ''}
        </tbody>
      </table>
    </div>
  `;

  render(adminLayout('#/admin/purchases', html));
}

async function acceptPurchase(id, userId, username, amount) {
  try {
    await updateCoinOrderStatus(id, 'accepted');
    await addCoins(userId, amount);
    toastSuccess(`✅ ${amount} coins crédités à ${username}`);
    renderAdminPurchases();
  } catch(e) {
    toastError('Erreur lors de l\'acceptation');
  }
}

async function refusePurchase(id, username) {
  try {
    await updateCoinOrderStatus(id, 'refused');
    toastInfo(`Demande de ${username} refusée`);
    renderAdminPurchases();
  } catch(e) {
    toastError('Erreur lors du refus');
  }
}
