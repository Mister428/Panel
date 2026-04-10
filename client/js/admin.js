import { toast } from './ui.js';
import {
  apiGetUsers,
  apiApproveUser,
  apiRejectUser,
  apiDeleteUser,
  getCurrentUser
} from './api.js';

async function loadUsers() {
  const list = document.getElementById('users-list');
  if (!list) return;

  list.innerHTML = '<p class="muted">Chargement...</p>';

  try {
    const users = await apiGetUsers();
    list.innerHTML = '';

    if (!users.length) {
      list.innerHTML = '<p class="muted">Aucun utilisateur.</p>';
      return;
    }

    users.forEach(u => {
      const card = document.createElement('article');
      card.className = 'panel';
      card.innerHTML = `
        <h4 style="font-family:Orbitron;margin:0 0 6px;">${u.username} ${u.role === 'admin' ? '(Admin)' : ''}</h4>
        <p class="mini-note">ID: ${u._id}</p>
        <p class="mini-note">Approuvé: <b style="color:${u.approved ? '#00ff85' : '#ffd166'}">${u.approved}</b></p>
      `;

      const actions = document.createElement('div');
      actions.className = 'actions';

      if (!u.approved) {
        const appr = document.createElement('button');
        appr.className = 'btn small primary';
        appr.textContent = 'Approuver';
        appr.onclick = async () => {
          await apiApproveUser(u._id);
          toast('Approuvé');
          loadUsers();
        };
        actions.appendChild(appr);
      } else {
        const rej = document.createElement('button');
        rej.className = 'btn small orange';
        rej.textContent = 'Désapprouver';
        rej.onclick = async () => {
          await apiRejectUser(u._id);
          toast('Désapprouvé');
          loadUsers();
        };
        actions.appendChild(rej);
      }

      const del = document.createElement('button');
      del.className = 'btn small danger';
      del.textContent = 'Supprimer';
      del.onclick = async () => {
        if (!confirm('Supprimer cet utilisateur ?')) return;
        await apiDeleteUser(u._id);
        toast('Utilisateur supprimé');
        loadUsers();
      };
      actions.appendChild(del);

      card.appendChild(actions);
      list.appendChild(card);
    });
  } catch (e) {
    toast(e.message);
  }
}

const user = getCurrentUser();

if (!user || user.role !== 'admin') {
  toast('Accès admin requis. Connecte-toi en admin.');
} else {
  loadUsers();
}
