function renderNavbar() {
  const adminLink = isAdmin() ? `<a href="#/admin" style="color:var(--gold-primary);font-family:'Jost';font-size:14px;">Admin</a>` : '';
  const adminLinkMobile = isAdmin() ? `<a href="#/admin" onclick="toggleMobileMenu()" style="color:var(--gold-primary);font-family:'Jost';font-size:16px;text-decoration:none;font-weight:500;">Admin</a>` : '';
  
  return `
  <nav class="navbar">
    <div style="display:flex;align-items:center;gap:12px;">
      <button class="mobile-menu-btn" onclick="toggleMobileMenu()">☰</button>
      <a href="#/lobby" style="font-family:'Cinzel';color:var(--gold-primary);font-size:18px;font-weight:700;text-decoration:none;">♦ ROYAL NEXUS</a>
    </div>
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
  </nav>
  
  <!-- Mobile Menu Dropdown -->
  <div id="mobile-nav-menu">
    <a href="#/lobby" onclick="toggleMobileMenu()" style="color:var(--text-primary);font-family:'Jost';font-size:16px;text-decoration:none;font-weight:500;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:8px;">Lobby</a>
    <a href="#/wallet" onclick="toggleMobileMenu()" style="color:var(--text-primary);font-family:'Jost';font-size:16px;text-decoration:none;font-weight:500;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:8px;">Portefeuille</a>
    ${adminLinkMobile}
  </div>`;
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobile-nav-menu');
  if (menu) {
    menu.classList.toggle('active');
  }
}

async function handleSignOut() {
  await signOut();
  currentUser = null;
  currentProfile = null;
  window.location.hash = '#/';
}
