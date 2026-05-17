function renderLanding() {
  render(`
  <div>
    <!-- HERO -->
    <section style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;
      background-image:linear-gradient(rgba(0,0,0,0.75),rgba(0,0,0,0.92)),url('https://images.unsplash.com/photo-1519999482648-25049ddd37b1?w=1600&q=80');
      background-size:cover;background-position:center;text-align:center;padding:40px 20px;">
      <h1 style="font-family:'Cinzel';font-size:clamp(32px,6vw,64px);font-weight:700;color:var(--gold-primary);
        text-shadow:0 0 40px rgba(201,168,76,0.4);letter-spacing:4px;">♦ ROYAL NEXUS ♦</h1>
      <p style="font-family:'Cormorant Garamond';font-style:italic;font-size:clamp(18px,2.5vw,26px);
        color:var(--text-secondary);margin-top:16px;">Le Casino Exclusif de la Famille</p>
      <div style="width:60px;height:1px;background:var(--gold-primary);margin:28px auto;"></div>
      <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;">
        <button onclick="navigatePage('#/login')" class="btn-outline-gold">Se connecter</button>
        <button onclick="navigatePage('#/login?tab=register')" class="btn-gold">Créer un compte</button>
      </div>
    </section>

    <!-- SECTION JEUX -->
    <section style="padding:80px 40px;max-width:1200px;margin:0 auto;">
      <h2 style="font-family:'Cinzel';color:var(--gold-primary);text-align:center;font-size:28px;margin-bottom:48px;letter-spacing:2px;">NOS JEUX</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;">
        ${gameCard('Roulette Américaine', 'Misez sur les couleurs, les numéros ou les douzaines', '360_F_187706793_ZJ9Dp3C4obZzN3EQBf297LBf50X3bpx1.jpg', '#/games/roulette')}
        ${gameCard('Machine à Sous', 'Alignez les symboles pour décrocher le jackpot', 'imgbloc-mas-roul1.jpg', '#/games/slots')}
        ${gameCard('Crash', 'Cash out avant le crash ou perdez tout', 'Gemini_Generated_Image_ts3qjzts3qjzts3q.png', '#/games/crash')}
      </div>
    </section>

    <!-- FOOTER -->
    <footer style="text-align:center;padding:32px;border-top:1px solid rgba(201,168,76,0.1);">
      <p style="font-family:'Cinzel';color:var(--text-muted);font-size:12px;letter-spacing:1px;">
        ROYAL NEXUS CASINO © 2025 — JEU FICTIF À USAGE FAMILIAL EXCLUSIVEMENT
      </p>
    </footer>
  </div>`);
}

function gameCard(name, desc, imgUrl, href) {
  return `
  <div onclick="navigatePage('${href}')" class="card" style="cursor:pointer;overflow:hidden;padding:0;position:relative;height:320px;
    background-image:linear-gradient(rgba(0,0,0,0.4),rgba(0,0,0,0.75)),url('${imgUrl}');
    background-size:cover;background-position:center;">
    <div style="position:absolute;bottom:0;left:0;right:0;padding:24px;">
      <h3 style="font-family:'Cinzel';color:#fff;font-size:20px;margin-bottom:8px;">${name}</h3>
      <p style="font-family:'Jost';color:var(--text-secondary);font-size:14px;margin-bottom:16px;">${desc}</p>
      <button class="btn-outline-gold" style="font-size:13px;padding:8px 20px;">Découvrir →</button>
    </div>
  </div>`;
}
