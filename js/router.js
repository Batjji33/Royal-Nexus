const routes = {
  '#/'               : () => renderLanding(),
  '#/login'          : () => renderLogin(),
  '#/lobby'          : () => requireAuth(renderLobby),
  '#/games/roulette' : () => requireAuth(renderRoulette),
  '#/games/slots'    : () => requireAuth(renderSlots),
  '#/games/crash'    : () => requireAuth(renderCrash),
  '#/games/mines'    : () => requireAuth(renderMines),
  '#/wallet'         : () => requireAuth(renderWallet),
  '#/admin'          : () => requireAdmin(renderAdminDashboard),
  '#/admin/purchases': () => requireAdmin(renderAdminPurchases),
  '#/admin/withdrawals': () => requireAdmin(renderAdminWithdrawals),
  '#/admin/players'  : () => requireAdmin(renderAdminPlayers),
  '#/admin/history'  : () => requireAdmin(renderAdminHistory),
  '#/admin/settings' : () => requireAdmin(renderAdminSettings),
};

function requireAuth(fn) {
  if (!isLoggedIn()) { window.location.hash = '#/login'; return; }
  fn();
}

function requireAdmin(fn) {
  if (!isLoggedIn()) { window.location.hash = '#/login'; return; }
  if (!isAdmin()) { window.location.hash = '#/lobby'; return; }
  fn();
}

window.navigatePage = function(hash) { 
  window.location.hash = hash; 
  router(); 
};

// Aliasing the old function just in case
function navigate(hash) { window.navigatePage(hash); }

async function router() {
  const fullHash = window.location.hash || '#/';
  const baseHash = fullHash.split('?')[0]; // Ignorer les paramètres GET pour le routage
  
  const handler = routes[baseHash];
  if (handler) handler();
  else { window.location.hash = '#/'; }
}

// Initialisation
window.addEventListener('hashchange', router);
window.addEventListener('load', async () => {
  await initAuth();
  await loadJackpot();
  subscribeJackpot();
  router();
});
