const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---- AUTH (Option 2: 100% database auth) ----
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function signUp(username, password) {
  // Check if username already exists
  const { data: existing, error: checkError } = await db.from('profiles').select('id').eq('username', username).maybeSingle();
  if (checkError) throw checkError;
  if (existing) {
    throw new Error("Ce nom d'utilisateur est déjà pris.");
  }

  // Create a locally generated UUID
  const id = generateUUID();
  
  const { data, error } = await db.from('profiles').insert({ 
    id, 
    username, 
    password, 
    balance_coins: 10, 
    is_admin: false 
  }).select().single();
  
  if (error) throw error;
  
  // Save session to localStorage
  const session = { user: data };
  localStorage.setItem('royal_nexus_session', JSON.stringify(session));
  return session;
}

async function signIn(username, password) {
  const { data, error } = await db.from('profiles').select('*').eq('username', username).maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error("Nom d'utilisateur incorrect.");
  }
  if (data.password !== password) {
    throw new Error("Mot de passe incorrect.");
  }
  
  // Save session to localStorage
  const session = { user: data };
  localStorage.setItem('royal_nexus_session', JSON.stringify(session));
  return session;
}

async function signOut() {
  localStorage.removeItem('royal_nexus_session');
}

async function getSession() {
  const sessionStr = localStorage.getItem('royal_nexus_session');
  if (!sessionStr) return null;
  try {
    return JSON.parse(sessionStr);
  } catch (e) {
    localStorage.removeItem('royal_nexus_session');
    return null;
  }
}

// ---- PROFILE ----
async function getProfile(userId) {
  const { data } = await db.from('profiles').select('*').eq('id', userId).single();
  return data;
}

async function updateProfile(userId, updates) {
  await db.from('profiles').update(updates).eq('id', userId);
}

// ---- SETTINGS ----
async function getSettings() {
  const { data } = await db.from('settings').select('*');
  const map = {};
  (data || []).forEach(row => { map[row.key] = row.value; });
  return map;
}

async function updateSetting(key, value) {
  // First, check if the setting exists
  const { data, error: fetchError } = await db.from('settings').select('key').eq('key', key).maybeSingle();
  if (data) {
    await db.from('settings').update({ value, updated_at: new Date().toISOString() }).eq('key', key);
  } else {
    await db.from('settings').insert({ key, value, updated_at: new Date().toISOString() });
  }
}

// ---- COIN ORDERS ----
async function createCoinOrder(userId, username, coinsAmount) {
  const settings = await getSettings();
  const rate = parseFloat(settings.coins_per_euro || '10');
  const eurosAmount = (coinsAmount / rate).toFixed(2);
  const { error } = await db.from('coin_orders').insert({ user_id: userId, username, coins_amount: coinsAmount, euros_amount: eurosAmount });
  if (error) throw error;
}

async function getCoinOrders(userId = null) {
  let query = db.from('coin_orders').select('*').order('created_at', { ascending: false });
  if (userId) query = query.eq('user_id', userId);
  const { data } = await query;
  return data || [];
}

async function updateCoinOrderStatus(id, status) {
  await db.from('coin_orders').update({ status }).eq('id', id);
}

// ---- WITHDRAWALS ----
async function createWithdrawal(userId, username, coinsAmount) {
  const settings = await getSettings();
  const rate = parseFloat(settings.coins_per_euro || '10');
  const eurosAmount = (coinsAmount / rate).toFixed(2);
  const { error } = await db.from('withdrawals').insert({ user_id: userId, username, coins_amount: coinsAmount, euros_amount: eurosAmount });
  if (error) throw error;
}

async function getWithdrawals(userId = null) {
  let query = db.from('withdrawals').select('*').order('created_at', { ascending: false });
  if (userId) query = query.eq('user_id', userId);
  const { data } = await query;
  return data || [];
}

async function updateWithdrawalStatus(id, status) {
  await db.from('withdrawals').update({ status }).eq('id', id);
}

// ---- GAME SESSIONS ----
async function processGame(userId, username, gameType, betCoins, gainCoins, netCoins, resultDesc) {
  const { data, error } = await db.rpc('process_game', {
    p_user_id: userId, p_username: username, p_game_type: gameType,
    p_bet_coins: betCoins, p_gain_coins: gainCoins,
    p_net_coins: netCoins, p_result_description: resultDesc
  });
  if (error) throw error;
  return data;
}

async function getGameSessions(userId = null, gameType = null) {
  let query = db.from('game_sessions').select('*').order('created_at', { ascending: false });
  if (userId) query = query.eq('user_id', userId);
  if (gameType) query = query.eq('game_type', gameType);
  const { data } = await query;
  return data || [];
}

// ---- ADMIN ----
async function addCoins(targetUserId, amount) {
  await db.rpc('add_coins', { target_user_id: targetUserId, amount });
}

async function deductCoins(targetUserId, amount) {
  const { data } = await db.rpc('deduct_coins', { target_user_id: targetUserId, amount });
  return data;
}

async function getAllProfiles() {
  const { data } = await db.from('profiles').select('*').eq('is_admin', false).order('created_at', { ascending: false });
  return data || [];
}

async function resetGameSessions() {
  const { error } = await db.from('game_sessions').delete().neq('username', '');
  if (error) throw error;
}
