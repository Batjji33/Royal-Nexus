// État global de l'utilisateur connecté
let currentUser = null;
let currentProfile = null;

async function initAuth() {
  // Fetch conversion rate setting
  try {
    const settings = await getSettings();
    window.coinsPerEuro = parseFloat(settings.coins_per_euro || '10');
  } catch(e) {
    window.coinsPerEuro = 10;
  }

  const session = await getSession();
  if (session) {
    currentUser = session.user;
    currentProfile = await getProfile(session.user.id);
  }
}

async function refreshProfile() {
  if (currentUser) {
    currentProfile = await getProfile(currentUser.id);
    // Met à jour le solde affiché dans la navbar
    const balanceEl = document.getElementById('navbar-balance');
    if (balanceEl && currentProfile) {
      balanceEl.textContent = formatCoins(currentProfile.balance_coins);
    }
  }
}

function isLoggedIn() { return !!currentUser; }
function isAdmin() { return currentProfile?.is_admin === true; }
