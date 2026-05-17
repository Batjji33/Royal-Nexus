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
    return `<a href="${l.href}" style="display:flex;align-items:center;gap:12px;padding:12px 20px;
      color:${active ? 'var(--gold-primary)' : 'var(--text-secondary)'};
      background:${active ? 'var(--bg-card)' : 'transparent'};
      border-left:2px solid ${active ? 'var(--gold-primary)' : 'transparent'};
      text-decoration:none;font-family:'Jost';font-size:14px;transition:all 0.2s;">
      <span>${l.icon}</span> ${l.label}
    </a>`;
  }).join('');

  return `
  <aside style="width:220px;min-height:100vh;background:#0D0D0D;border-right:1px solid rgba(201,168,76,0.15);display:flex;flex-direction:column;flex-shrink:0;">
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

function adminLayout(activePage, contentHTML) {
  return `
  <div style="display:flex;min-height:100vh;">
    ${renderAdminSidebar(activePage)}
    <main style="flex:1;padding:32px;overflow-y:auto;">
      ${contentHTML}
    </main>
  </div>`;
}
