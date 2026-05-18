async function renderAdminSettings() {
  render(adminLayout('#/admin/settings', spinnerHTML()));
  const settings = await getSettings();

  const html = `
    <h1 style="font-family:'Cinzel';color:var(--gold-primary);font-size:28px;margin-bottom:32px;">Paramètres du casino</h1>
    
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(400px,1fr));gap:32px;">
      
      <!-- Configuration des mises -->
      <div class="card">
        <h3 style="font-family:'Cinzel';color:var(--text-primary);font-size:18px;margin-bottom:24px;">Configuration des mises</h3>
        
        <div style="margin-bottom:16px;">
          <label style="font-family:'Jost';color:var(--text-secondary);font-size:13px;display:block;margin-bottom:6px;">Mise minimum Roulette (coins)</label>
          <input type="number" id="set-roulette" class="input-gold" value="${settings.roulette_min_bet || '5'}">
        </div>
        
        <div style="margin-bottom:16px;">
          <label style="font-family:'Jost';color:var(--text-secondary);font-size:13px;display:block;margin-bottom:6px;">Coût par spin — Machine à Sous (coins)</label>
          <input type="number" id="set-slots" class="input-gold" value="${settings.slots_cost_per_spin || '5'}">
        </div>
        
        <div style="margin-bottom:24px;">
          <label style="font-family:'Jost';color:var(--text-secondary);font-size:13px;display:block;margin-bottom:6px;">Mise minimum Crash (coins)</label>
          <input type="number" id="set-crash" class="input-gold" value="${settings.crash_min_bet || '10'}">
        </div>

        <button onclick="saveGameSettings()" class="btn-gold" style="width:100%;">Enregistrer les coûts</button>
        <p style="font-family:'Jost';color:var(--text-muted);font-size:12px;margin-top:12px;text-align:center;">
          Les modifications s'appliquent immédiatement. Les parties en cours ne sont pas affectées.
        </p>
      </div>

      <!-- Accès Administrateur -->
      <div class="card">
        <h3 style="font-family:'Cinzel';color:var(--text-primary);font-size:18px;margin-bottom:12px;">Accès Administrateur</h3>
        
        <div style="background:rgba(180,130,0,0.1);border:1px solid rgba(180,130,0,0.2);border-radius:6px;padding:12px;margin-bottom:24px;">
          <p style="font-family:'Jost';color:#E2C97E;font-size:13px;">
            ⚠️ Ces identifiants sont utilisés pour le compte admin. Modifiez-les avec précaution.
            <br><span style="opacity:0.7;">Identifiants par défaut : admin / admin123</span>
          </p>
        </div>

        <div style="margin-bottom:16px;">
          <label style="font-family:'Jost';color:var(--text-secondary);font-size:13px;display:block;margin-bottom:6px;">Nom d'utilisateur admin</label>
          <input type="text" id="set-admin-user" class="input-gold" value="${settings.admin_username || 'admin'}">
        </div>
        
        <div style="margin-bottom:16px;">
          <label style="font-family:'Jost';color:var(--text-secondary);font-size:13px;display:block;margin-bottom:6px;">Nouveau mot de passe</label>
          <input type="password" id="set-admin-pass1" class="input-gold" placeholder="Laissez vide pour ne pas modifier">
        </div>

        <div style="margin-bottom:24px;">
          <label style="font-family:'Jost';color:var(--text-secondary);font-size:13px;display:block;margin-bottom:6px;">Confirmer le mot de passe</label>
          <input type="password" id="set-admin-pass2" class="input-gold" placeholder="Laissez vide pour ne pas modifier">
        </div>

        <button onclick="saveAdminCredentials()" class="btn-outline-gold" style="width:100%;">Mettre à jour les identifiants</button>
      </div>

      <!-- Configuration de l'économie -->
      <div class="card">
        <h3 style="font-family:'Cinzel';color:var(--text-primary);font-size:18px;margin-bottom:24px;">Économie (Taux des coins)</h3>
        
        <div style="margin-bottom:24px;">
          <label style="font-family:'Jost';color:var(--text-secondary);font-size:13px;display:block;margin-bottom:6px;">Nombre de coins pour 1 € (Taux de conversion)</label>
          <input type="number" id="set-coins-per-euro" class="input-gold" min="1" step="1" value="${settings.coins_per_euro || '10'}">
          <p style="font-family:'Jost';color:var(--text-muted);font-size:12px;margin-top:10px;line-height:1.5;">
            Par défaut : 10 coins = 1 €. 
            <br>Si vous augmentez ce nombre (ex: 20), alors 20 coins vaudront 1 € (les coins seront moins chers).
            <br>Si vous le baissez (ex: 5), alors 5 coins vaudront 1 € (les coins seront plus chers).
          </p>
        </div>

        <button onclick="saveEconomySettings()" class="btn-gold" style="width:100%;">Enregistrer le taux</button>
      </div>

      <!-- Bonus & Récompenses -->
      <div class="card">
        <h3 style="font-family:'Cinzel';color:var(--gold-primary);font-size:17px;margin-bottom:16px;">
          Bonus & Récompenses
        </h3>
        <label style="font-family:'Jost';color:var(--text-secondary);font-size:13px;display:block;margin-bottom:6px;">
          Bonus Explorer — montant en coins
        </label>
        <input id="s-bonus" type="number" min="1" class="input-gold" style="max-width:200px;margin-bottom:8px;"
          value="${settings.explorer_bonus_amount||50}">
        <p style="font-family:'Jost';color:var(--text-muted);font-size:12px;margin-top:6px;margin-bottom:14px;line-height:1.4;">
          Accordé chaque jour au joueur ayant joué 5 parties sur chacun des 3 jeux.
        </p>
        
        <!-- Lucky Day Explorer Bonus Checkbox -->
        <div style="margin-top:16px;border-top:1px dashed rgba(201,168,76,0.2);padding-top:14px;margin-bottom:20px;">
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none;">
            <input type="checkbox" id="explorer-lucky-day" style="width:18px;height:18px;accent-color:var(--gold-primary);" 
              ${settings.explorer_bonus_lucky_day === 'true' ? 'checked' : ''}>
            <span style="font-family:'Jost';color:var(--text-secondary);font-size:14px;font-weight:600;">🍀 Activer le "Jour de chance"</span>
          </label>
          <p style="font-family:'Jost';color:var(--text-muted);font-size:12px;margin-top:6px;line-height:1.4;">
            Active une animation festive dorée/verte ("Lucky Day") et indique aux joueurs que le montant est plus important que d'habitude !
          </p>
        </div>

        <button class="btn-gold" style="padding:8px 16px;font-size:13px;" onclick="saveBonusSettings()">Enregistrer le bonus</button>
      </div>

      <!-- Jackpot Progressif -->
      <div class="card">
        <h3 style="font-family:'Cinzel',serif;color:#C9A84C;font-size:17px;margin-bottom:6px;">
          ♦ Jackpot Progressif
        </h3>
        <p style="font-family:'Jost',sans-serif;color:#5A5040;font-size:12px;margin-bottom:20px;">
          Le jackpot grossit après chaque partie et se réinitialise après une victoire.
        </p>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:20px;">
          <div>
            <label style="color:#A89A7A;font-size:13px;display:block;margin-bottom:5px;">Valeur actuelle</label>
            <input id="jp-current" type="number" min="0" class="input-gold" value="${settings.jackpot_current||50}">
          </div>
          <div>
            <label style="color:#A89A7A;font-size:13px;display:block;margin-bottom:5px;">Incrément</label>
            <input id="jp-increment" type="number" min="1" class="input-gold" value="${settings.jackpot_increment||1}">
          </div>
          <div>
            <label style="color:#A89A7A;font-size:13px;display:block;margin-bottom:5px;">Départ après victoire</label>
            <input id="jp-seed" type="number" min="1" class="input-gold" value="${settings.jackpot_seed||50}">
          </div>
          <div>
            <label style="color:#A89A7A;font-size:13px;display:block;margin-bottom:5px;">Plafond max</label>
            <input id="jp-max" type="number" min="1" class="input-gold" value="${settings.jackpot_max||300}">
          </div>
        </div>

        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <button class="btn-gold" style="padding:8px 16px;font-size:13px;" onclick="saveJackpotSettings()">
            Enregistrer
          </button>
          <button class="btn-outline-gold" style="padding:8px 16px;font-size:13px;" onclick="resetJackpot()">
            Réinitialiser au seed
          </button>
        </div>
        <p style="font-family:'Jost',sans-serif;color:#5A5040;font-size:12px;margin-top:14px;">
          Déclencheur : Lucky 7 aux Slots ou numéro 7 à la Roulette.
        </p>
      </div>

    </div>
  `;

  render(adminLayout('#/admin/settings', html));
}

async function saveGameSettings() {
  const roulette = document.getElementById('set-roulette').value;
  const slots = document.getElementById('set-slots').value;
  const crash = document.getElementById('set-crash').value;
  
  if (!roulette || !slots || !crash) { toastError("Tous les champs doivent être remplis."); return; }
  
  try {
    await updateSetting('roulette_min_bet', roulette);
    await updateSetting('slots_cost_per_spin', slots);
    await updateSetting('crash_min_bet', crash);
    toastSuccess("✅ Coûts mis à jour. Applicables immédiatement pour tous les joueurs.");
  } catch(e) {
    toastError("Erreur lors de la mise à jour des paramètres.");
  }
}

async function saveEconomySettings() {
  const rate = document.getElementById('set-coins-per-euro').value;
  if (!rate || isNaN(rate) || parseFloat(rate) <= 0) {
    toastError("Le taux de conversion doit être un nombre supérieur à 0.");
    return;
  }
  try {
    await updateSetting('coins_per_euro', rate);
    toastSuccess("✅ Taux de conversion mis à jour. Applicable immédiatement.");
  } catch(e) {
    toastError("Erreur lors de la mise à jour de l'économie.");
  }
}

async function saveAdminCredentials() {
  const user = document.getElementById('set-admin-user').value.trim();
  const pass1 = document.getElementById('set-admin-pass1').value;
  const pass2 = document.getElementById('set-admin-pass2').value;

  if (!user) { toastError("Le nom d'utilisateur admin ne peut pas être vide."); return; }
  
  let updatingPassword = false;
  if (pass1 || pass2) {
    if (pass1 !== pass2) { toastError("Les mots de passe ne correspondent pas."); return; }
    if (pass1.length < 6) { toastError("Le mot de passe doit faire au moins 6 caractères."); return; }
    updatingPassword = true;
  }

  try {
    await updateSetting('admin_username', user);
    await updateProfile(currentProfile.id, { username: user });
    
    if (updatingPassword) {
      await updateSetting('admin_password', pass1);
      const { error } = await db.auth.updateUser({ password: pass1 });
      if (error) throw error;
    }

    toastSuccess("✅ Identifiants mis à jour. Reconnexion en cours...");
    
    setTimeout(async () => {
      await handleSignOut();
    }, 2000);
    
  } catch(e) {
    toastError("Erreur lors de la mise à jour des identifiants.");
  }
}

async function saveBonusSettings() {
  const val = document.getElementById('s-bonus')?.value;
  const isLucky = document.getElementById('explorer-lucky-day')?.checked ? 'true' : 'false';
  
  if (!val || isNaN(val) || parseInt(val) < 1) {
    toastError('Montant invalide.'); return;
  }
  try {
    await updateSetting('explorer_bonus_amount', val);
    await updateSetting('explorer_bonus_lucky_day', isLucky);
    toastSuccess('✅ Bonus et option Jour de chance mis à jour.');
  } catch(e) {
    toastError('Erreur lors de la sauvegarde.');
  }
}

async function saveJackpotSettings() {
  const current   = document.getElementById('jp-current')?.value;
  const increment = document.getElementById('jp-increment')?.value;
  const seed      = document.getElementById('jp-seed')?.value;
  const max       = document.getElementById('jp-max')?.value;

  if ([current, increment, seed, max].some(v => !v || isNaN(v) || parseInt(v) < 1)) {
    toastError('Valeurs invalides.'); return;
  }

  await Promise.all([
    updateSetting('jackpot_current',   current),
    updateSetting('jackpot_increment', increment),
    updateSetting('jackpot_seed',      seed),
    updateSetting('jackpot_max',       max),
  ]);

  jackpotCurrent = parseInt(current);
  updateJackpotDisplays();
  toastSuccess('✅ Jackpot mis à jour.');
}

async function resetJackpot() {
  const seed = document.getElementById('jp-seed')?.value
    || (await getSettings()).jackpot_seed
    || '50';
  await updateSetting('jackpot_current', seed);
  document.getElementById('jp-current').value = seed;
  jackpotCurrent = parseInt(seed);
  updateJackpotDisplays();
  toastSuccess('✅ Jackpot réinitialisé à ' + seed + ' coins.');
}
