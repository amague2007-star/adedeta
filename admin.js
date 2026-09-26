// =============================================
// ADEDETA - Admin (Serveur unique)
// API_URL = MÊME DOMAINE que le frontend
// =============================================

const API_URL = window.location.origin;

let isAdminLoggedIn = false;

// =============================================
// CONNEXION ADMIN
// =============================================
const adminLoginForm = document.getElementById('adminLoginForm');
adminLoginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = document.getElementById('admin-password').value;

  if (!password) {
    showMessage('admin-login-message', 'Entre le mot de passe', 'error');
    return;
  }

  const btn = adminLoginForm.querySelector('button');
  btn.disabled = true;
  btn.textContent = 'Connexion...';

  try {
    const res = await fetch(API_URL + '/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password }),
    });
    const data = await res.json();

    if (data.ok) {
      isAdminLoggedIn = true;
      sessionStorage.setItem('adedeta_admin', 'true');
      showMessage('admin-login-message', 'Connexion reussie !', 'success');
      setTimeout(() => {
        showAdminScreen('dashboard');
        loadAllData();
      }, 800);
    } else {
      showMessage('admin-login-message', 'Mot de passe incorrect', 'error');
    }
  } catch (err) {
    console.error(err);
    showMessage('admin-login-message', 'Impossible de contacter le serveur', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Se connecter';
  }
});

// =============================================
// NAVIGATION ADMIN
// =============================================
function showAdminScreen(name) {
  document.getElementById('admin-login-screen').style.display = (name === 'login') ? 'block' : 'none';
  document.getElementById('admin-dashboard').style.display = (name === 'dashboard') ? 'block' : 'none';
  window.scrollTo(0, 0);
}

// =============================================
// MESSAGES
// =============================================
function showMessage(elementId, text, type) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = text;
  el.className = 'message ' + type;
}

// =============================================
// DECONNEXION
// =============================================
document.getElementById('adminLogout').addEventListener('click', (e) => {
  e.preventDefault();
  isAdminLoggedIn = false;
  sessionStorage.removeItem('adedeta_admin');
  showAdminScreen('login');
});

// =============================================
// ONGLETS
// =============================================
document.querySelectorAll('.admin-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');

    document.querySelectorAll('.tab-content').forEach((c) => (c.style.display = 'none'));
    document.getElementById('tab-' + tab.dataset.tab).style.display = 'block';
  });
});

// =============================================
// CHARGER TOUTES LES DONNEES
// =============================================
async function loadAllData() {
  await Promise.all([
    loadStats(),
    loadClients(),
    loadDrivers(),
    loadRides(),
  ]);
}

document.getElementById('btnRefreshAdmin').addEventListener('click', loadAllData);

// =============================================
// STATISTIQUES
// =============================================
async function loadStats() {
  try {
    const res = await fetch(API_URL + '/admin/stats');
    const data = await res.json();
    if (data.ok) {
      document.getElementById('statClients').textContent = data.stats.clients;
      document.getElementById('statDrivers').textContent = data.stats.drivers;
      document.getElementById('statRides').textContent = data.stats.rides;
      document.getElementById('statEarnings').textContent = data.stats.earnings;
    }
  } catch (err) {
    console.error('Stats error:', err);
  }
}

// =============================================
// CLIENTS
// =============================================
async function loadClients() {
  const container = document.getElementById('tab-clients');
  container.innerHTML = '<p class="loading-text">Chargement...</p>';

  try {
    const res = await fetch(API_URL + '/admin/clients');
    const data = await res.json();

    if (data.ok && data.clients.length > 0) {
      container.innerHTML = '';
      data.clients.forEach((client) => {
        const div = document.createElement('div');
        div.className = 'admin-item';
        div.innerHTML =
          '<div class="admin-item-header">' +
          '<span class="admin-item-name">' + client.name + '</span>' +
          '<span class="admin-item-id">#' + client.id + '</span>' +
          '</div>' +
          '<div class="admin-item-info">Telephone : ' + client.phone + '</div>' +
          '<div class="admin-item-info">Inscrit le : ' + new Date(client.created_at).toLocaleDateString() + '</div>' +
          '<div class="admin-item-actions">' +
          '<button class="btn-delete" data-id="' + client.id + '" data-name="' + client.name + '">Supprimer</button>' +
          '</div>';
        container.appendChild(div);
      });

      container.querySelectorAll('.btn-delete').forEach((btn) => {
        btn.addEventListener('click', () => deleteUser(btn.dataset.id, btn.dataset.name));
      });
    } else {
      container.innerHTML = '<p class="loading-text">Aucun client enregistre</p>';
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="loading-text">Erreur de chargement</p>';
  }
}

// =============================================
// CONDUCTEURS
// =============================================
async function loadDrivers() {
  const container = document.getElementById('tab-drivers');
  container.innerHTML = '<p class="loading-text">Chargement...</p>';

  try {
    const res = await fetch(API_URL + '/admin/drivers');
    const data = await res.json();

    if (data.ok && data.drivers.length > 0) {
      container.innerHTML = '';
      data.drivers.forEach((driver) => {
        const div = document.createElement('div');
        div.className = 'admin-item';
        div.innerHTML =
          '<div class="admin-item-header">' +
          '<span class="admin-item-name">' + driver.name + '</span>' +
          '<span class="admin-item-id">#' + driver.driver_id + '</span>' +
          '</div>' +
          '<div class="admin-item-info">Telephone : ' + driver.phone + '</div>' +
          '<div class="admin-item-info">Plaque moto : ' + driver.moto_plate + '</div>' +
          '<div class="admin-item-info">' + (driver.total_rides || 0) + ' courses - ' + (driver.total_earnings || 0) + ' FCFA</div>' +
          '<div class="admin-item-actions">' +
          '<button class="btn-delete" data-id="' + driver.user_id + '" data-name="' + driver.name + '">Supprimer</button>' +
          '</div>';
        container.appendChild(div);
      });

      container.querySelectorAll('.btn-delete').forEach((btn) => {
        btn.addEventListener('click', () => deleteUser(btn.dataset.id, btn.dataset.name));
      });
    } else {
      container.innerHTML = '<p class="loading-text">Aucun conducteur enregistre</p>';
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="loading-text">Erreur de chargement</p>';
  }
}

// =============================================
// COURSES
// =============================================
async function loadRides() {
  const container = document.getElementById('tab-rides');
  container.innerHTML = '<p class="loading-text">Chargement...</p>';

  try {
    const res = await fetch(API_URL + '/admin/rides');
    const data = await res.json();

    if (data.ok && data.rides.length > 0) {
      container.innerHTML = '';
      data.rides.forEach((ride) => {
        const div = document.createElement('div');
        div.className = 'admin-item';
        div.innerHTML =
          '<div class="admin-item-header">' +
          '<span class="admin-item-name">Course #' + ride.id + ' - ' + ride.price + ' FCFA</span>' +
          '<span class="status-badge-admin ' + ride.status + '">' + ride.status + '</span>' +
          '</div>' +
          '<div class="admin-item-info">Client : ' + (ride.client_name || '--') + ' (' + (ride.client_phone || '--') + ')</div>' +
          '<div class="admin-item-info">Conducteur : ' + (ride.driver_name || 'En attente') + (ride.moto_plate ? ' (' + ride.moto_plate + ')' : '') + '</div>' +
          '<div class="admin-item-info">' + new Date(ride.created_at).toLocaleString() + '</div>';
        container.appendChild(div);
      });
    } else {
      container.innerHTML = '<p class="loading-text">Aucune course enregistree</p>';
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="loading-text">Erreur de chargement</p>';
  }
}

// =============================================
// SUPPRIMER UN UTILISATEUR
// =============================================
async function deleteUser(id, name) {
  if (!confirm('Supprimer definitivement ' + name + ' ?\n\nCette action est irreversible !')) {
    return;
  }

  try {
    const res = await fetch(API_URL + '/admin/user/' + id, {
      method: 'DELETE',
    });
    const data = await res.json();

    if (data.ok) {
      alert('Utilisateur supprime');
      loadAllData();
    } else {
      alert('Erreur : ' + (data.error || 'inconnue'));
    }
  } catch (err) {
    console.error(err);
    alert('Impossible de contacter le serveur');
  }
}

// =============================================
// AU DEMARRAGE
// =============================================
window.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('adedeta_admin') === 'true') {
    isAdminLoggedIn = true;
    showAdminScreen('dashboard');
    loadAllData();
  } else {
    showAdminScreen('login');
  }
});

console.log('ADEDETA admin charge ! API:', API_URL);