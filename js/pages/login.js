function renderLogin() {
  const tab = window.location.hash.includes('register') ? 'register' : 'login';
  render(`
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;background:var(--bg-primary);">
    <div class="card" style="width:100%;max-width:440px;">
      <div style="text-align:center;margin-bottom:28px;">
        <h1 style="font-family:'Cinzel';color:var(--gold-primary);font-size:22px;letter-spacing:2px;">♦ ROYAL NEXUS ♦</h1>
        <p style="font-family:'Jost';color:var(--text-muted);font-size:13px;margin-top:6px;">Connexion & Inscription</p>
      </div>
      <hr class="divider-gold">
      <!-- Onglets -->
      <div style="display:flex;border-bottom:1px solid rgba(201,168,76,0.15);margin-bottom:24px;">
        <button class="tab-btn ${tab==='login'?'active':''}" id="tab-login" onclick="switchTab('login')">Se connecter</button>
        <button class="tab-btn ${tab==='register'?'active':''}" id="tab-register" onclick="switchTab('register')">Créer un compte</button>
      </div>
      <!-- Formulaire connexion -->
      <div id="form-login" style="display:${tab==='login'?'block':'none'}">
        <div style="margin-bottom:16px;">
          <label style="font-family:'Jost';color:var(--text-secondary);font-size:13px;display:block;margin-bottom:6px;">Nom d'utilisateur</label>
          <input id="login-username" type="text" class="input-gold" placeholder="Votre pseudo">
        </div>
        <div style="margin-bottom:24px;">
          <label style="font-family:'Jost';color:var(--text-secondary);font-size:13px;display:block;margin-bottom:6px;">Mot de passe</label>
          <input id="login-password" type="password" class="input-gold" placeholder="••••••••">
        </div>
        <div id="login-error" style="color:#f87171;font-family:'Jost';font-size:13px;margin-bottom:12px;display:none;"></div>
        <button onclick="handleLogin()" class="btn-gold" style="width:100%;">Se connecter</button>
      </div>
      <!-- Formulaire inscription -->
      <div id="form-register" style="display:${tab==='register'?'block':'none'}">

        <div style="margin-bottom:16px;">
          <label style="font-family:'Jost';color:var(--text-secondary);font-size:13px;display:block;margin-bottom:6px;">Nom d'utilisateur</label>
          <input id="reg-username" type="text" class="input-gold" placeholder="MonPseudo">
        </div>
        <div style="margin-bottom:16px;">
          <label style="font-family:'Jost';color:var(--text-secondary);font-size:13px;display:block;margin-bottom:6px;">Mot de passe</label>
          <input id="reg-password" type="password" class="input-gold" placeholder="Minimum 6 caractères">
        </div>
        <div style="margin-bottom:24px;">
          <label style="font-family:'Jost';color:var(--text-secondary);font-size:13px;display:block;margin-bottom:6px;">Confirmer le mot de passe</label>
          <input id="reg-confirm" type="password" class="input-gold" placeholder="••••••••">
        </div>
        <div id="reg-error" style="color:#f87171;font-family:'Jost';font-size:13px;margin-bottom:12px;display:none;"></div>
        <button onclick="handleRegister()" class="btn-gold" style="width:100%;">Créer mon compte</button>
      </div>
    </div>
  </div>`);
}

function switchTab(tab) {
  document.getElementById('form-login').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('form-register').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
}

async function handleLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.style.display = 'none';
  try {
    const data = await signIn(username, password);
    currentUser = data.user;
    currentProfile = await getProfile(data.user.id);
    window.location.hash = '#/lobby';
  } catch (e) {
    errEl.textContent = translateError(e.message);
    errEl.style.display = 'block';
  }
}

async function handleRegister() {
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm  = document.getElementById('reg-confirm').value;
  const errEl    = document.getElementById('reg-error');
  errEl.style.display = 'none';

  if (password !== confirm) { errEl.textContent = 'Les mots de passe ne correspondent pas.'; errEl.style.display = 'block'; return; }
  if (!username) { errEl.textContent = "Le nom d'utilisateur est obligatoire."; errEl.style.display = 'block'; return; }

  try {
    await signUp(username, password);
    const session = await getSession();
    currentUser = session.user;
    currentProfile = await getProfile(session.user.id);
    toastSuccess('Bienvenue ! 10 coins de bienvenue ont été crédités sur votre compte Royal Nexus.');
    window.location.hash = '#/lobby';
  } catch (e) {
    errEl.textContent = translateError(e.message);
    errEl.style.display = 'block';
  }
}
