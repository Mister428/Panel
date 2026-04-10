import { toast } from './ui.js';
import {
  apiLogin,
  apiRegister,
  setAuth,
  clearAuth,
  apiGetBots,
  apiCreateBot,
  apiStartBot,
  apiStopBot,
  apiDeleteBot,
  getCurrentUser
} from './api.js';

let socket = null;
let bots = [];

const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const navLogin = document.getElementById('nav-login');
const navRegister = document.getElementById('nav-register');
const navDashboard = document.getElementById('nav-dashboard');
const logoutBtn = document.getElementById('logoutBtn');

navLogin?.addEventListener('click', (e) => {
  e.preventDefault();
  authSection.classList.remove('hidden');
  dashboardSection.classList.add('hidden');
});

navRegister?.addEventListener('click', (e) => {
  e.preventDefault();
  authSection.classList.remove('hidden');
  dashboardSection.classList.add('hidden');
});

navDashboard?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!getCurrentUser()) return;
  authSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
  loadBots();
});

logoutBtn?.addEventListener('click', () => {
  clearAuth();
  socket?.disconnect();
  toast('Déconnecté');
  window.location.reload();
});

document.getElementById('login-btn')?.addEventListener('click', async () => {
  const u = document.getElementById('login-username').value.trim();
  const p = document.getElementById('login-password').value.trim();

  if (!u || !p) return toast('Username et mot de passe requis');

  try {
    const res = await apiLogin(u, p);
    setAuth(res.token, res.user);
    toast('Connexion réussie');
    updateUIAfterLogin();
  } catch (e) {
    toast(e.message);
  }
});

document.getElementById('register-btn')?.addEventListener('click', async () => {
  const u = document.getElementById('reg-username').value.trim();
  const p = document.getElementById('reg-password').value.trim();

  if (!u || !p) return toast('Username et mot de passe requis');

  try {
    const res = await apiRegister(u, p);
    toast(res.message || 'Compte créé');
    document.getElementById('approval-status').textContent = 'En attente d’approbation';
  } catch (e) {
    toast(e.message);
  }
});

document.getElementById('add-bot-btn')?.addEventListener('click', async () => {
  const type = document.getElementById('bot-type').value;
  const name = document.getElementById('bot-name').value.trim();
  const token = document.getElementById('bot-token').value.trim();

  if (!name) return toast('Nom du bot requis');

  try {
    const payload = { type, name };
    if (type === 'telegram') payload.telegramToken = token;

    const bot = await apiCreateBot(payload);
    toast('Bot créé');
    bots.unshift(bot);
    renderBots();
    updateStats();
  } catch (e) {
    toast(e.message);
  }
});

function initSocket(user) {
  socket = io('http://localhost:4000');

  socket.on('connect', () => {
    socket.emit('registerUser', user.id);
  });

  socket.on('log', (data) => {
    appendLog(data.message, data.timestamp);
  });

  socket.on('systemLog', (data) => {
    appendLog('SYSTEM ' + data.message, data.timestamp);
  });
}

function appendLog(message, timestamp) {
  const term = document.getElementById('logs-terminal');
  if (!term) return;

  const line = document.createElement('div');
  line.className = 'terminal-line';
  const ts = new Date(timestamp).toLocaleTimeString('fr-FR');
  line.textContent = `[${ts}] ${message}`;

  term.appendChild(line);
  term.scrollTop = term.scrollHeight;
}

function renderBots() {
  const container = document.getElementById('bots-list');
  if (!container) return;

  container.innerHTML = '';

  if (!bots.length) {
    container.innerHTML = '<p class="muted">Aucun bot pour le moment.</p>';
    return;
  }

  bots.forEach(bot => {
    const card = document.createElement('article');
    card.className = 'card';

    const img = document.createElement('div');
    img.style.height = '100%';
    img.innerHTML = `
      <div style="width:100%;height:100%;border-radius:20px;background:radial-gradient(circle at top, rgba(0,245,255,.5),transparent 60%), #020509;border:1px solid rgba(255,255,255,.05);display:flex;align-items:center;justify-content:center;font-family:Orbitron;font-size:20px;color:#00f5ff;">
        ${bot.type === 'telegram' ? 'TG' : 'WA'}
      </div>
    `;

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = `
      <h4>${bot.name}</h4>
      <p class="desc">Type : ${bot.type.toUpperCase()} — Statut : <span style="color:${bot.status === 'online' ? '#00ff85' : '#ffd166'}">${bot.status}</span></p>
    `;

    const actions = document.createElement('div');
    actions.className = 'actions';

    const startBtn = document.createElement('button');
    startBtn.className = 'btn small primary';
    startBtn.textContent = 'Démarrer';
    startBtn.onclick = async () => {
      try {
        await apiStartBot(bot._id);
        toast('Bot démarré');
        await loadBots();
      } catch (e) {
        toast(e.message);
      }
    };

    const stopBtn = document.createElement('button');
    stopBtn.className = 'btn small orange';
    stopBtn.textContent = 'Arrêter';
    stopBtn.onclick = async () => {
      try {
        await apiStopBot(bot._id);
        toast('Bot arrêté');
        await loadBots();
      } catch (e) {
        toast(e.message);
      }
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn small danger';
    deleteBtn.textContent = 'Supprimer';
    deleteBtn.onclick = async () => {
      if (!confirm('Supprimer ce bot ?')) return;
      try {
        await apiDeleteBot(bot._id);
        bots = bots.filter(b => b._id !== bot._id);
        renderBots();
        updateStats();
        toast('Bot supprimé');
      } catch (e) {
        toast(e.message);
      }
    };

    actions.append(startBtn, stopBtn, deleteBtn);
    meta.appendChild(actions);
    card.appendChild(img);
    card.appendChild(meta);
    container.appendChild(card);
  });
}

async function loadBots() {
  try {
    bots = await apiGetBots();
    renderBots();
    updateStats();
  } catch (e) {
    toast(e.message);
  }
}

function updateStats() {
  const tg = bots.filter(b => b.type === 'telegram').length;
  const wa = bots.filter(b => b.type === 'whatsapp').length;

  const statTg = document.getElementById('stat-tg');
  const statWa = document.getElementById('stat-wa');

  if (statTg) statTg.textContent = tg;
  if (statWa) statWa.textContent = wa;
}

function updateUIAfterLogin() {
  const user = getCurrentUser();
  if (!user) return;

  const approvalStatus = document.getElementById('approval-status');
  if (approvalStatus) {
    approvalStatus.textContent = user.approved ? 'Approuvé' : 'En attente / Refusé';
  }

  navDashboard.classList.remove('hidden');
  logoutBtn.classList.remove('hidden');

  if (user.approved || user.role === 'admin') {
    authSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    initSocket(user);
    loadBots();
  } else {
    toast('Compte non approuvé. Contacte l’admin.');
  }
}

if (getCurrentUser()) {
  updateUIAfterLogin();
}