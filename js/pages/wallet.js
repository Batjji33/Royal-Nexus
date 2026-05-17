async function renderWallet() {
  render(renderNavbar() + spinnerHTML());
  
  const settings = await getSettings();
  const coinsPerEuro = parseFloat(settings.coins_per_euro || '10');
  window.coinsPerEuro = coinsPerEuro;

  const coinOrders = await getCoinOrders(currentProfile.id);
  const withdrawals = await getWithdrawals(currentProfile.id);
  const sessions = await getGameSessions(currentProfile.id);
  
  const transactions = [
    ...coinOrders.map(o => ({ ...o, type: 'Achat', icon: '📈' })),
    ...withdrawals.map(w => ({ ...w, type: 'Retrait', icon: '📉' }))
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const bal = currentProfile.balance_coins;
  let balColor = '#f87171'; // red
  if (bal > 50) balColor = '#4ade80'; // green
  else if (bal >= 10) balColor = '#fbbf24'; // amber

  render(`
  ${renderNavbar()}
  <div style="max-width:900px;margin:0 auto;padding:40px 24px;">
    
    <!-- SECTION 1 : Solde -->
    <div class="card" style="text-align:center;margin-bottom:32px;">
      <h2 style="font-family:'Cinzel';color:var(--text-muted);font-size:16px;letter-spacing:2px;margin-bottom:16px;">VOTRE SOLDE</h2>
      <div style="font-family:'Cormorant Garamond';color:var(--gold-primary);font-size:48px;font-weight:700;">
        ${bal} coins
      </div>
      <div style="font-family:'Jost';color:var(--text-secondary);font-size:16px;margin-top:8px;">
        = ${(bal / coinsPerEuro).toFixed(2)} € NexusBank
      </div>
      <div style="margin-top:16px;">
        <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${balColor};box-shadow:0 0 10px ${balColor};"></span>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;margin-bottom:40px;">
      <!-- SECTION 2 : Acheter -->
      <div class="card">
        <h3 style="font-family:'Cinzel';color:var(--gold-primary);font-size:18px;margin-bottom:20px;">Acheter des coins</h3>
        <label style="font-family:'Jost';color:var(--text-secondary);font-size:13px;display:block;margin-bottom:6px;">Nombre de coins (multiple de 10)</label>
        <input type="number" id="buy-amount" class="input-gold" min="10" step="10" value="10" oninput="updateBuyEuros()">
        <p style="font-family:'Jost';color:var(--gold-light);font-size:14px;margin:12px 0 20px;">
          = <span id="buy-euros">${(10 / coinsPerEuro).toFixed(2)}</span> € à virer sur NexusBank
        </p>
        <button onclick="handleBuy()" class="btn-gold" style="width:100%;">Envoyer la demande</button>
      </div>

      <!-- SECTION 3 : Retirer -->
      <div class="card">
        <h3 style="font-family:'Cinzel';color:var(--gold-primary);font-size:18px;margin-bottom:20px;">Retirer des coins</h3>
        <label style="font-family:'Jost';color:var(--text-secondary);font-size:13px;display:block;margin-bottom:6px;">Nombre de coins (multiple de 10)</label>
        <input type="number" id="withdraw-amount" class="input-gold" min="10" step="10" max="${Math.floor(bal/10)*10}" value="10" oninput="updateWithdrawEuros()">
        <p style="font-family:'Jost';color:var(--gold-light);font-size:14px;margin:12px 0 20px;">
          = <span id="withdraw-euros">${(10 / coinsPerEuro).toFixed(2)}</span> € vous seront virés
        </p>
        <button onclick="handleWithdraw()" class="btn-outline-gold" style="width:100%;">Demander un retrait</button>
      </div>
    </div>

    <!-- SECTION 4 : Historique -->
    <div class="card" style="padding:0;overflow:hidden;">
      <div style="display:flex;border-bottom:1px solid rgba(201,168,76,0.15);background:rgba(0,0,0,0.2);">
        <button class="tab-btn active" id="tab-transactions" onclick="switchWalletTab('transactions')" style="flex:1;">Transactions</button>
        <button class="tab-btn" id="tab-sessions" onclick="switchWalletTab('sessions')" style="flex:1;">Mes parties</button>
      </div>
      
      <div id="wallet-transactions" style="padding:24px;overflow-x:auto;">
        ${transactions.length === 0 ? '<p style="text-align:center;color:var(--text-muted);font-family:\'Jost\';">Aucune transaction pour le moment</p>' : `
          <table class="table-royal">
            <thead><tr><th>Type</th><th>Coins</th><th>Euros</th><th>Statut</th><th>Date</th></tr></thead>
            <tbody>
              ${transactions.map(t => `
                <tr>
                  <td>${t.icon} ${t.type}</td>
                  <td>${t.coins_amount}</td>
                  <td>${t.euros_amount} €</td>
                  <td>${statusBadge(t.status)}</td>
                  <td style="color:var(--text-muted);font-size:12px;">${formatDate(t.created_at)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>

      <div id="wallet-sessions" style="padding:24px;overflow-x:auto;display:none;">
        ${sessions.length === 0 ? '<p style="text-align:center;color:var(--text-muted);font-family:\'Jost\';">Vous n\'avez pas encore joué</p>' : `
          <table class="table-royal">
            <thead><tr><th>Jeu</th><th>Mise</th><th>Résultat</th><th>Net</th><th>Date</th></tr></thead>
            <tbody>
              ${sessions.map(s => {
                const gameNames = { roulette: 'Roulette', slots: 'Machine à Sous', crash: 'Crash' };
                const netColor = s.net_coins > 0 ? '#4ade80' : s.net_coins < 0 ? '#f87171' : 'var(--text-secondary)';
                const sign = s.net_coins > 0 ? '+' : '';
                return `
                <tr>
                  <td>${gameNames[s.game_type] || s.game_type}</td>
                  <td>${s.bet_coins}</td>
                  <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${s.result_description}">${s.result_description}</td>
                  <td style="color:${netColor};font-weight:500;">${sign}${s.net_coins}</td>
                  <td style="color:var(--text-muted);font-size:12px;">${formatDate(s.created_at)}</td>
                </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `}
      </div>
    </div>
  </div>`);
}

function switchWalletTab(tab) {
  document.getElementById('wallet-transactions').style.display = tab === 'transactions' ? 'block' : 'none';
  document.getElementById('wallet-sessions').style.display = tab === 'sessions' ? 'block' : 'none';
  document.getElementById('tab-transactions').classList.toggle('active', tab === 'transactions');
  document.getElementById('tab-sessions').classList.toggle('active', tab === 'sessions');
}

function updateBuyEuros() {
  const v = parseInt(document.getElementById('buy-amount').value) || 0;
  const rate = window.coinsPerEuro || 10;
  document.getElementById('buy-euros').textContent = (v / rate).toFixed(2);
}

function updateWithdrawEuros() {
  const v = parseInt(document.getElementById('withdraw-amount').value) || 0;
  const rate = window.coinsPerEuro || 10;
  document.getElementById('withdraw-euros').textContent = (v / rate).toFixed(2);
}

async function handleBuy() {
  const v = parseInt(document.getElementById('buy-amount').value);
  if (isNaN(v) || v < 10 || v % 10 !== 0) {
    toastError('Le montant doit être un multiple de 10, minimum 10 coins.');
    return;
  }
  const rate = window.coinsPerEuro || 10;
  try {
    await createCoinOrder(currentProfile.id, currentProfile.username, v);
    toastSuccess(`Demande envoyée ! Effectuez un virement de ${(v/rate).toFixed(2)}€ sur NexusBank à l'administrateur.`);
    renderWallet();
  } catch (e) {
    toastError('Erreur lors de la demande.');
  }
}

async function handleWithdraw() {
  const v = parseInt(document.getElementById('withdraw-amount').value);
  if (isNaN(v) || v < 10 || v % 10 !== 0) {
    toastError('Le montant doit être un multiple de 10, minimum 10 coins.');
    return;
  }
  if (v > currentProfile.balance_coins) {
    toastError('Solde insuffisant.');
    return;
  }
  const rate = window.coinsPerEuro || 10;
  try {
    await createWithdrawal(currentProfile.id, currentProfile.username, v);
    toastSuccess(`Demande de retrait envoyée ! L'administrateur effectuera le virement NexusBank de ${(v/rate).toFixed(2)}€ sous peu.`);
    renderWallet();
  } catch (e) {
    toastError('Erreur lors de la demande.');
  }
}
