async function renderLobby() {
  render(renderNavbar() + spinnerHTML());
  const settings = await getSettings();
  window.coinsPerEuro = parseFloat(settings.coins_per_euro || '10');
  const minRoulette = settings.roulette_min_bet || '5';
  const costSlots   = settings.slots_cost_per_spin || '5';
  const minCrash    = settings.crash_min_bet || '10';
  const bal = currentProfile?.balance_coins || 0;

  const warningBanner = bal === 0 ? `
    <div style="background:rgba(139,0,0,0.2);border:1px solid rgba(139,0,0,0.4);border-radius:8px;padding:16px 24px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
      <span style="font-family:'Jost';color:#f87171;">Votre solde est vide. Rechargez votre compte pour jouer.</span>
      <button onclick="navigatePage('#/wallet')" class="btn-gold" style="padding:8px 16px;font-size:13px;">Recharger →</button>
    </div>` : '';

  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const { data: todaySessions } = await db
    .from('game_sessions')
    .select('game_type')
    .eq('user_id', currentUser.id)
    .gte('created_at', todayStart.toISOString());

  const dayCount = { roulette: 0, slots: 0, crash: 0 };
  (todaySessions||[]).forEach(s => {
    if (dayCount[s.game_type] !== undefined) dayCount[s.game_type]++;
  });

  const last = currentProfile.explorer_bonus_last_claimed;
  const claimedToday = last &&
    new Date(last).toDateString() === new Date().toDateString();

  const allDone = dayCount.roulette>=5 && dayCount.slots>=5 && dayCount.crash>=5;
  const bonusAmount = settings.explorer_bonus_amount || 50;

  const progressHTML = `
  <div class="card" style="margin-top:32px;">
    <div style="display:flex;align-items:center;justify-content:space-between;
      flex-wrap:wrap;gap:12px;margin-bottom:20px;">
      <div>
        <h3 style="font-family:'Cinzel';color:var(--gold-primary);font-size:16px;
          letter-spacing:1px;">BONUS EXPLORER</h3>
        <p style="font-family:'Jost';color:var(--text-muted);font-size:12px;margin-top:3px;">
          Jouez 5 parties sur chaque jeu pour gagner ${bonusAmount} coins
        </p>
      </div>
      ${allDone && !claimedToday ? `
        <button onclick="claimExplorerBonus()" style="
          background:linear-gradient(135deg,#C9A84C,#8B6914);
          color:#080808;font-family:'Jost';font-weight:700;
          padding:10px 22px;border:none;border-radius:6px;
          cursor:pointer;font-size:14px;animation:pulse-gold 2s infinite;
        ">✨ Réclamer →</button>` : claimedToday ? `
        <span style="font-family:'Jost';color:#2D7A3A;font-size:13px;">✓ Réclamé aujourd'hui</span>
        ` : ''}
    </div>
    <div style="display:flex;flex-direction:column;gap:12px;">
      ${[
        ['Roulette', dayCount.roulette],
        ['Machine à Sous', dayCount.slots],
        ['Crash', dayCount.crash]
      ].map(([name, count]) => {
        const pct = Math.min(count / 5 * 100, 100);
        const done = count >= 5;
        return `
        <div>
          <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
            <span style="font-family:'Jost';color:var(--text-secondary);font-size:13px;">${name}</span>
            <span style="font-family:'Cormorant Garamond';color:${done?'#4ade80':'var(--gold-primary)'};font-size:14px;">
              ${Math.min(count,5)}/5 ${done?'✓':''}
            </span>
          </div>
          <div style="background:var(--bg-secondary);border-radius:4px;height:6px;overflow:hidden;">
            <div style="
              height:100%;width:${pct}%;
              background:${done?'#2D7A3A':'linear-gradient(90deg,#8B6914,#C9A84C)'};
              border-radius:4px;transition:width .5s ease;
            "></div>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>`;

  render(`
  ${renderNavbar()}
  <div style="max-width:1200px;margin:0 auto;padding:40px 24px;">
    <!-- Hero bienvenue -->
    <div style="text-align:center;padding:40px 0 48px;background:radial-gradient(ellipse at center,rgba(201,168,76,0.06) 0%,transparent 70%);">
      <h1 style="font-family:'Cinzel';color:var(--gold-primary);font-size:clamp(24px,4vw,38px);letter-spacing:2px;">
        Bienvenue, ${currentProfile?.username || ''}</h1>
      <p style="font-family:'Cormorant Garamond';color:var(--text-secondary);font-size:20px;margin-top:10px;">
        ${formatCoins(bal)} — ${formatEuros(bal)}
      </p>
    </div>
    ${warningBanner}
    <!-- Cards jeux -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;">
      ${lobbyCard('Roulette Américaine','Misez sur les couleurs, les numéros ou les douzaines',
        '360_F_187706793_ZJ9Dp3C4obZzN3EQBf297LBf50X3bpx1.jpg',
        `Mise minimum : ${minRoulette} coins`,'#/games/roulette', bal < parseInt(minRoulette))}
      ${lobbyCard('Machine à Sous','Alignez les symboles pour décrocher le jackpot',
        'imgbloc-mas-roul1.jpg',
        `Coût par spin : ${costSlots} coins`,'#/games/slots', bal < parseInt(costSlots))}
      ${crashLobbyCard(minCrash, bal < parseInt(minCrash))}
    </div>
    ${progressHTML}
  </div>`);
}

function lobbyCard(name, desc, imgUrl, costLabel, href, disabled) {
  return `
  <div class="card" style="padding:0;overflow:hidden;height:380px;position:relative;cursor:${disabled?'default':'pointer'};
    background-image:linear-gradient(rgba(0,0,0,0.35),rgba(0,0,0,0.8)),url('${imgUrl}');
    background-size:cover;background-position:center;"
    onclick="${disabled ? '' : `navigatePage('${href}')`}">
    ${disabled ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,0.5);z-index:1;"></div>` : ''}
    <div style="position:absolute;bottom:0;left:0;right:0;padding:28px;z-index:2;">
      <h2 style="font-family:'Cinzel';color:#fff;font-size:20px;margin-bottom:8px;">${name}</h2>
      <p style="font-family:'Jost';color:var(--text-secondary);font-size:14px;margin-bottom:6px;">${desc}</p>
      <p style="font-family:'Jost';color:var(--gold-primary);font-size:12px;margin-bottom:16px;">${costLabel}</p>
      <button class="${disabled ? 'btn-outline-gold' : 'btn-gold'}" style="font-size:14px;padding:10px 24px;"
        onclick="${disabled ? `navigatePage('#/wallet')` : `navigatePage('${href}')`}">
        ${disabled ? 'Recharger le compte' : 'Jouer →'}
      </button>
    </div>
  </div>`;
}

function crashLobbyCard(minCrash, disabled) {
  return `
  <div class="card" style="padding:0;overflow:hidden;height:380px;position:relative;cursor:${disabled?'default':'pointer'};
    background-image:linear-gradient(rgba(0,0,0,0.45),rgba(0,0,0,0.85)),url('Gemini_Generated_Image_ts3qjzts3qjzts3q.png');
    background-size:cover;background-position:center;"
    onclick="${disabled ? '' : `navigatePage('#/games/crash')`}">
    <svg style="position:absolute;inset:0;width:100%;height:100%;opacity:0.25;" viewBox="0 0 400 300" preserveAspectRatio="none">
      <polyline points="0,280 80,240 160,180 220,120 280,80 320,60 380,20" fill="none" stroke="#C9A84C" stroke-width="2.5"/>
    </svg>
    ${disabled ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,0.5);z-index:1;"></div>` : ''}
    <div style="position:absolute;bottom:0;left:0;right:0;padding:28px;z-index:2;">
      <h2 style="font-family:'Cinzel';color:#fff;font-size:20px;margin-bottom:8px;">Crash</h2>
      <p style="font-family:'Jost';color:var(--text-secondary);font-size:14px;margin-bottom:6px;">Cash out avant le crash ou perdez tout</p>
      <p style="font-family:'Jost';color:var(--gold-primary);font-size:12px;margin-bottom:16px;">Mise minimum : ${minCrash} coins</p>
      <button class="${disabled?'btn-outline-gold':'btn-gold'}" style="font-size:14px;padding:10px 24px;"
        onclick="${disabled?`navigatePage('#/wallet')`:`navigatePage('#/games/crash')`}">
        ${disabled ? 'Recharger le compte' : 'Jouer →'}
      </button>
    </div>
  </div>`;
}
