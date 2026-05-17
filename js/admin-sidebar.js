function renderAdminSidebar(activePage) {
  const links = [
    { href: '#/admin',              label: 'Dashboard',   icon: '▣' },
    { href: '#/admin/purchases',    label: 'Achats',      icon: '↑' },
    { href: '#/admin/withdrawals',  label: 'Retraits',    icon: '↓' },
    { href: '#/admin/players',      label: 'Joueurs',     icon: '♟' },
    { href: '#/admin/history',      label: 'Historique',  icon: '≡' },
    { href: '#/admin/settings',     label: 'Paramètres',  icon: '⚙' },
  ];

  const linksHTML = links.map(l => {
    const active = activePage === l.href;
    return `<a href="${l.href}" onclick="closeAdminSidebar()" style="display:flex;align-items:center;gap:12px;padding:12px 20px;
      color:${active ? 'var(--gold-primary)' : 'var(--text-secondary)'};
      background:${active ? 'var(--bg-card)' : 'transparent'};
      border-left:2px solid ${active ? 'var(--gold-primary)' : 'transparent'};
      text-decoration:none;font-family:'Jost';font-size:14px;transition:all 0.2s;">
      <span>${l.icon}</span> ${l.label}
    </a>`;
  }).join('');

  return `
  <aside id="admin-sidebar" class="admin-sidebar">
    <div style="padding:20px;">
      <a href="#/lobby" style="color:var(--text-muted);font-family:'Jost';font-size:13px;text-decoration:none;">← Retour au Casino</a>
    </div>
    <hr class="divider-gold">
    <div style="text-align:center;padding:16px;">
      <div style="font-family:'Cinzel';color:var(--gold-primary);font-size:14px;">♦ ROYAL NEXUS</div>
      <div style="font-family:'Jost';color:var(--text-muted);font-size:11px;margin-top:4px;">Administration</div>
    </div>
    <hr class="divider-gold">
    <nav style="flex:1;">${linksHTML}</nav>
  </aside>`;
}

function toggleAdminSidebar() {
  const sidebar = document.getElementById('admin-sidebar');
  if (sidebar) {
    sidebar.classList.toggle('active');
  }
}

function closeAdminSidebar() {
  const sidebar = document.getElementById('admin-sidebar');
  if (sidebar) {
    sidebar.classList.remove('active');
  }
}

function adminLayout(activePage, contentHTML) {
  return `
  <div class="admin-mobile-header">
    <button onclick="toggleAdminSidebar()" style="background:transparent;border:none;color:var(--gold-primary);font-size:20px;cursor:pointer;display:flex;align-items:center;gap:8px;font-family:'Jost';">
      <span>☰</span> Menu Admin
    </button>
    <a href="#/lobby" style="color:var(--text-secondary);font-family:'Jost';font-size:13px;text-decoration:none;">Retour Casino</a>
  </div>
  <div class="admin-container">
    ${renderAdminSidebar(activePage)}
    <main class="admin-main">
      ${contentHTML}
    </main>
  </div>`;
}
