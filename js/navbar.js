function renderNavbar() {
  const adminLink = isAdmin() ? `<a href="#/admin" style="color:var(--gold-primary);font-family:'Jost';font-size:14px;">Admin</a>` : '';
  return `
  <nav class="navbar">
    <a href="#/lobby" style="font-family:'Cinzel';color:var(--gold-primary);font-size:18px;font-weight:700;text-decoration:none;">♦ ROYAL NEXUS</a>
    <div class="hide-mobile" style="display:flex;gap:28px;align-items:center;">
      <a href="#/lobby" style="color:var(--text-secondary);font-family:'Jost';font-size:14px;text-decoration:none;">Lobby</a>
      <a href="#/wallet" style="color:var(--text-secondary);font-family:'Jost';font-size:14px;text-decoration:none;">Portefeuille</a>
      ${adminLink}
    </div>
    <div style="display:flex;align-items:center;gap:16px;">
      <span id="navbar-balance" style="background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);color:var(--gold-primary);padding:6px 14px;border-radius:6px;font-family:'Cormorant Garamond';font-size:15px;">
        ${currentProfile ? formatCoins(currentProfile.balance_coins) : '...'}
      </span>
      <span class="hide-mobile" style="color:var(--text-secondary);font-family:'Jost';font-size:14px;">${currentProfile?.username || ''}</span>
      <button onclick="handleSignOut()" class="btn-outline-gold" style="padding:6px 14px;font-size:13px;">Déconnexion</button>
    </div>
  </nav>`;
}

async function handleSignOut() {
  await signOut();
  currentUser = null;
  currentProfile = null;
  window.location.hash = '#/';
}
