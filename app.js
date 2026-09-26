// =============================================
// ADEDETA - Frontend (Serveur unique)
// API_URL = MÊME DOMAINE que le frontend
// =============================================

// Si la page est servie depuis ngrok, on utilise la même URL
// Sinon en local, on utilise localhost
const API_URL = window.location.origin;

let currentUser = null;
let currentRide = null;
let currentDriver = null;
let currentDriverRide = null;

// =============================================
// NAVIGATION ENTRE ECRANS
// =============================================
const screens = {
  register: document.getElementById('screen-register'),
  login: document.getElementById('screen-login'),
  order: document.getElementById('screen-order'),
  tracking: document.getElementById('screen-tracking'),
  'driver-register': document.getElementById('screen-driver-register'),
  'driver-login': document.getElementById('screen-driver-login'),
  'driver-home': document.getElementById('screen-driver-home'),
  'driver-active': document.getElementById('screen-driver-active'),
};

function showScreen(name) {
  Object.keys(screens).forEach((key) => {
    if (screens[key]) {
      screens[key].style.display = key === name ? 'block' : 'none';
    }
  });
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
// INSCRIPTION CLIENT
// =============================================
const registerForm = document.getElementById('registerForm');
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();

  if (!name || !phone) {
    showMessage('register-message', 'Remplis tous les champs', 'error');
    return;
  }

  const btn = registerForm.querySelector('button');
  btn.disabled = true;
  btn.textContent = 'Inscription...';

  try {
    const res = await fetch(API_URL + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, phone: phone }),
    });
    const data = await res.json();

    if (data.ok) {
      showMessage('register-message', 'Inscription reussie ! Connecte-toi.', 'success');
      document.getElementById('login-phone').value = phone;
      setTimeout(() => showScreen('login'), 1500);
    } else {
      showMessage('register-message', 'Erreur : ' + (data.error || 'inconnue'), 'error');
    }
  } catch (err) {
    console.error(err);
    showMessage('register-message', 'Impossible de contacter le serveur', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = "S'inscrire";
  }
});

// =============================================
// LOGIN CLIENT
// =============================================
const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const phone = document.getElementById('login-phone').value.trim();

  if (!phone) {
    showMessage('login-message', 'Entre ton numero', 'error');
    return;
  }

  const btn = loginForm.querySelector('button');
  btn.disabled = true;
  btn.textContent = 'Connexion...';

  try {
    const res = await fetch(API_URL + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone }),
    });
    const data = await res.json();

    if (data.ok) {
      currentUser = data.user;
      localStorage.setItem('adedeta_user', JSON.stringify(currentUser));
      document.getElementById('userName').textContent = currentUser.name;
      showMessage('login-message', 'Connexion reussie !', 'success');
      setTimeout(() => showScreen('order'), 800);
    } else {
      showMessage('login-message', 'Numero non trouve. Inscris-toi.', 'error');
    }
  } catch (err) {
    console.error(err);
    showMessage('login-message', 'Impossible de contacter le serveur', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Se connecter';
  }
});

// =============================================
// LIENS CLIENT
// =============================================
document.getElementById('linkToLogin').addEventListener('click', (e) => {
  e.preventDefault();
  showScreen('login');
});

document.getElementById('linkToRegister').addEventListener('click', (e) => {
  e.preventDefault();
  showScreen('register');
});

document.getElementById('logoutLink').addEventListener('click', (e) => {
  e.preventDefault();
  currentUser = null;
  localStorage.removeItem('adedeta_user');
  showScreen('login');
});

// =============================================
// MODE LISTE / MANUEL
// =============================================
let pickupMode = 'list';
let destinationMode = 'list';

document.getElementById('pickupModeList').addEventListener('click', () => {
  pickupMode = 'list';
  document.getElementById('pickupModeList').classList.add('active');
  document.getElementById('pickupModeManual').classList.remove('active');
  document.getElementById('pickup').style.display = 'block';
  document.getElementById('pickup').required = true;
  document.getElementById('pickupManual').style.display = 'none';
  document.getElementById('pickupManual').value = '';
  updatePrice();
});

document.getElementById('pickupModeManual').addEventListener('click', () => {
  pickupMode = 'manual';
  document.getElementById('pickupModeManual').classList.add('active');
  document.getElementById('pickupModeList').classList.remove('active');
  document.getElementById('pickup').style.display = 'none';
  document.getElementById('pickup').required = false;
  document.getElementById('pickup').value = '';
  document.getElementById('pickupManual').style.display = 'block';
  updatePrice();
});

document.getElementById('destModeList').addEventListener('click', () => {
  destinationMode = 'list';
  document.getElementById('destModeList').classList.add('active');
  document.getElementById('destModeManual').classList.remove('active');
  document.getElementById('destination').style.display = 'block';
  document.getElementById('destination').required = true;
  document.getElementById('destinationManual').style.display = 'none';
  document.getElementById('destinationManual').value = '';
  updatePrice();
});

document.getElementById('destModeManual').addEventListener('click', () => {
  destinationMode = 'manual';
  document.getElementById('destModeManual').classList.add('active');
  document.getElementById('destModeList').classList.remove('active');
  document.getElementById('destination').style.display = 'none';
  document.getElementById('destination').required = false;
  document.getElementById('destination').value = '';
  document.getElementById('destinationManual').style.display = 'block';
  updatePrice();
});

// =============================================
// COMMANDER UNE COURSE
// =============================================
const orderForm = document.getElementById('orderForm');
orderForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  let pickup, destination;

  if (pickupMode === 'list') {
    pickup = document.getElementById('pickup').value;
  } else {
    pickup = document.getElementById('pickupManual').value.trim();
  }

  if (destinationMode === 'list') {
    destination = document.getElementById('destination').value;
  } else {
    destination = document.getElementById('destinationManual').value.trim();
  }

  const price = parseInt(document.getElementById('estimatedPrice').textContent, 10);

  if (!pickup || !destination) {
    showMessage('order-message', 'Choisis le depart et la destination', 'error');
    return;
  }

  const btn = orderForm.querySelector('button');
  btn.disabled = true;
  btn.textContent = 'Commande...';

  try {
    const res = await fetch(API_URL + '/ride/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: currentUser.id,
        pickup: pickup,
        destination: destination,
        price: price,
      }),
    });
    const data = await res.json();

    if (data.ok) {
      currentRide = data.ride;
      document.getElementById('trackPickup').textContent = pickup;
      document.getElementById('trackDestination').textContent = destination;
      document.getElementById('trackPrice').textContent = price;
      showMessage('order-message', 'Course commandee !', 'success');
      setTimeout(() => showScreen('tracking'), 1000);
    } else {
      showMessage('order-message', 'Erreur : ' + (data.error || 'inconnue'), 'error');
    }
  } catch (err) {
    console.error(err);
    showMessage('order-message', 'Impossible de contacter le serveur', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Commander maintenant';
  }
});

// =============================================
// DISTANCES DES LIEUX DE TAHOUA
// =============================================
const LIEUX = {
  'Grand Marche': 0,
  'Hotel Tarka': 1,
  'Prefecture': 1.5,
  'Quartier Bagagi': 2,
  'Hopital de Tahoua': 2.5,
  'Quartier Toudou': 2.5,
  'Gare Routiere': 3,
  'Quartier Sabon Gari': 3,
  'Stade de Tahoua': 3.5,
  'Lycee Issa Korombe': 4,
  'Universite': 5,
  'Marche de betail': 6,
  'Aeroport': 8,
};

// =============================================
// GRILLE TARIFAIRE
// =============================================
function calculerPrix(distance) {
  if (distance <= 2) return 200;
  if (distance <= 5) return 300;
  if (distance <= 10) return 1000;
  if (distance <= 15) return 1500;
  return 2000;
}

function calculerDistance(depart, arrivee) {
  if (!depart || !arrivee) return 0;
  const d1 = LIEUX[depart] || 0;
  const d2 = LIEUX[arrivee] || 0;
  let distance = Math.abs(d2 - d1);
  if (distance === 0) distance = 1;
  return distance;
}

function trouverLieuProche(texte) {
  if (!texte) return null;
  const texteLower = texte.toLowerCase();

  for (const nom of Object.keys(LIEUX)) {
    const nomLower = nom.toLowerCase();
    if (texteLower.includes(nomLower)) {
      return nom;
    }
  }

  if (texteLower.includes('marche')) return 'Grand Marche';
  if (texteLower.includes('hopital') || texteLower.includes('hospital')) return 'Hopital de Tahoua';
  if (texteLower.includes('universite') || texteLower.includes('univ')) return 'Universite';
  if (texteLower.includes('gare')) return 'Gare Routiere';
  if (texteLower.includes('aeroport')) return 'Aeroport';
  if (texteLower.includes('stade')) return 'Stade de Tahoua';
  if (texteLower.includes('prefecture')) return 'Prefecture';
  if (texteLower.includes('lycee')) return 'Lycee Issa Korombe';
  if (texteLower.includes('tarka')) return 'Hotel Tarka';
  if (texteLower.includes('bagagi')) return 'Quartier Bagagi';
  if (texteLower.includes('toudou')) return 'Quartier Toudou';
  if (texteLower.includes('sabon gari')) return 'Quartier Sabon Gari';
  if (texteLower.includes('betail') || texteLower.includes('bétail')) return 'Marche de betail';

  return null;
}

function updatePrice() {
  let pickupName, destName;
  let distance = 0;

  if (pickupMode === 'list') {
    pickupName = document.getElementById('pickup').value;
  } else {
    pickupName = document.getElementById('pickupManual').value.trim();
  }

  if (destinationMode === 'list') {
    destName = document.getElementById('destination').value;
  } else {
    destName = document.getElementById('destinationManual').value.trim();
  }

  if (pickupMode === 'list' && destinationMode === 'list') {
    distance = calculerDistance(pickupName, destName);
  } else if (pickupName && destName) {
    distance = 3;

    let distanceLieuConnu = 0;

    if (pickupMode === 'list' && LIEUX[pickupName] !== undefined) {
      distanceLieuConnu = LIEUX[pickupName];
    } else if (pickupMode === 'manual') {
      const matched = trouverLieuProche(pickupName);
      if (matched) distanceLieuConnu = LIEUX[matched];
    }

    if (destinationMode === 'list' && LIEUX[destName] !== undefined) {
      distanceLieuConnu = Math.max(distanceLieuConnu, LIEUX[destName]);
    } else if (destinationMode === 'manual') {
      const matched = trouverLieuProche(destName);
      if (matched) distanceLieuConnu = Math.max(distanceLieuConnu, LIEUX[matched]);
    }

    if (distanceLieuConnu > 0) {
      distance = distanceLieuConnu;
    }
  }

  const price = calculerPrix(distance);

  document.getElementById('estimatedDistance').textContent = distance;
  document.getElementById('estimatedPrice').textContent = price;
}

document.getElementById('pickup').addEventListener('change', updatePrice);
document.getElementById('destination').addEventListener('change', updatePrice);
document.getElementById('pickupManual').addEventListener('input', updatePrice);
document.getElementById('destinationManual').addEventListener('input', updatePrice);

// =============================================
// NOUVELLE COURSE
// =============================================
document.getElementById('btnNewRide').addEventListener('click', () => {
  orderForm.reset();
  document.getElementById('estimatedDistance').textContent = '0';
  document.getElementById('estimatedPrice').textContent = '0';

  pickupMode = 'list';
  destinationMode = 'list';

  document.getElementById('pickupModeList').classList.add('active');
  document.getElementById('pickupModeManual').classList.remove('active');
  document.getElementById('pickup').style.display = 'block';
  document.getElementById('pickupManual').style.display = 'none';

  document.getElementById('destModeList').classList.add('active');
  document.getElementById('destModeManual').classList.remove('active');
  document.getElementById('destination').style.display = 'block';
  document.getElementById('destinationManual').style.display = 'none';

  showScreen('order');
});

// =============================================
// SWITCH CLIENT / CONDUCTEUR
// =============================================
document.getElementById('switchToDriver').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('switchToClient').classList.remove('active');
  document.getElementById('switchToDriver').classList.add('active');
  if (currentDriver) {
    showScreen('driver-home');
    loadAvailableRides();
    loadDriverStats();
  } else {
    showScreen('driver-login');
  }
});

document.getElementById('switchToClient').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('switchToDriver').classList.remove('active');
  document.getElementById('switchToClient').classList.add('active');
  if (currentUser) {
    showScreen('order');
  } else {
    showScreen('register');
  }
});

document.getElementById('linkToDriverRegister').addEventListener('click', (e) => {
  e.preventDefault();
  showScreen('driver-register');
});

document.getElementById('linkToDriverLogin').addEventListener('click', (e) => {
  e.preventDefault();
  showScreen('driver-login');
});

document.getElementById('driverLogoutLink').addEventListener('click', (e) => {
  e.preventDefault();
  currentDriver = null;
  localStorage.removeItem('adedeta_driver');
  showScreen('driver-login');
});

// =============================================
// INSCRIPTION CONDUCTEUR
// =============================================
const driverRegisterForm = document.getElementById('driverRegisterForm');
driverRegisterForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('drv-name').value.trim();
  const phone = document.getElementById('drv-phone').value.trim();
  const moto_plate = document.getElementById('drv-plate').value.trim();

  if (!name || !phone || !moto_plate) {
    showMessage('driver-register-message', 'Remplis tous les champs', 'error');
    return;
  }

  const btn = driverRegisterForm.querySelector('button');
  btn.disabled = true;
  btn.textContent = 'Inscription...';

  try {
    const res = await fetch(API_URL + '/driver/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, phone: phone, moto_plate: moto_plate }),
    });
    const data = await res.json();

    if (data.ok) {
      showMessage('driver-register-message', 'Inscription reussie ! Connecte-toi.', 'success');
      document.getElementById('drv-login-phone').value = phone;
      setTimeout(() => showScreen('driver-login'), 1500);
    } else {
      showMessage('driver-register-message', 'Erreur : ' + (data.error || 'inconnue'), 'error');
    }
  } catch (err) {
    console.error(err);
    showMessage('driver-register-message', 'Impossible de contacter le serveur', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Devenir ADEDETA';
  }
});

// =============================================
// LOGIN CONDUCTEUR
// =============================================
const driverLoginForm = document.getElementById('driverLoginForm');
driverLoginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const phone = document.getElementById('drv-login-phone').value.trim();

  if (!phone) {
    showMessage('driver-login-message', 'Entre ton numero', 'error');
    return;
  }

  const btn = driverLoginForm.querySelector('button');
  btn.disabled = true;
  btn.textContent = 'Connexion...';

  try {
    const res = await fetch(API_URL + '/driver/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone }),
    });
    const data = await res.json();

    if (data.ok) {
      currentDriver = data.driver;
      localStorage.setItem('adedeta_driver', JSON.stringify(currentDriver));
      document.getElementById('driverName').textContent = currentDriver.name;
      showMessage('driver-login-message', 'Connexion reussie !', 'success');
      setTimeout(() => {
        showScreen('driver-home');
        loadAvailableRides();
        loadDriverStats();
      }, 800);
    } else {
      showMessage('driver-login-message', 'Conducteur non trouve. Inscris-toi.', 'error');
    }
  } catch (err) {
    console.error(err);
    showMessage('driver-login-message', 'Impossible de contacter le serveur', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Se connecter';
  }
});

// =============================================
// CHARGER LES COURSES DISPONIBLES
// =============================================
async function loadAvailableRides() {
  const container = document.getElementById('availableRides');
  container.innerHTML = '<p class="no-rides">Chargement...</p>';

  try {
    const res = await fetch(API_URL + '/rides/available');
    const data = await res.json();

    if (data.ok && data.rides.length > 0) {
      container.innerHTML = '';
      data.rides.forEach((ride) => {
        const card = document.createElement('div');
        card.className = 'ride-card';
        card.innerHTML =
          '<div class="ride-card-header">' +
          '<strong>' + ride.price + ' FCFA</strong>' +
          '<span>Course #' + ride.id + '</span>' +
          '</div>' +
          '<div class="ride-card-client">Client : ' + ride.client_name + ' - ' + ride.client_phone + '</div>' +
          '<div class="ride-card-time">' + new Date(ride.created_at).toLocaleTimeString() + '</div>' +
          '<button class="btn-accept" data-ride-id="' + ride.id + '">Accepter cette course</button>';
        container.appendChild(card);
      });

      container.querySelectorAll('.btn-accept').forEach((btn) => {
        btn.addEventListener('click', () => acceptRide(btn.dataset.rideId));
      });
    } else {
      container.innerHTML = '<p class="no-rides">Aucune course disponible pour le moment</p>';
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="no-rides">Erreur de chargement</p>';
  }
}

document.getElementById('btnRefreshRides').addEventListener('click', () => {
  loadAvailableRides();
  loadDriverStats();
});

// =============================================
// STATS CONDUCTEUR
// =============================================
async function loadDriverStats() {
  if (!currentDriver) return;
  try {
    const res = await fetch(API_URL + '/driver/' + currentDriver.driver_id + '/stats');
    const data = await res.json();
    if (data.ok) {
      document.getElementById('driverTotalRides').textContent = data.stats.total_rides || 0;
      document.getElementById('driverEarnings').textContent = data.stats.total_earnings || 0;
    }
  } catch (err) {
    console.error('Stats error:', err);
  }
}

// =============================================
// ACCEPTER UNE COURSE
// =============================================
async function acceptRide(rideId) {
  try {
    const res = await fetch(API_URL + '/ride/' + rideId + '/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driver_id: currentDriver.driver_id }),
    });
    const data = await res.json();

    if (data.ok) {
      currentDriverRide = data.ride;

      try {
        const rideRes = await fetch(API_URL + '/ride/' + rideId + '/status');
        const rideData = await rideRes.json();
        if (rideData.ok) {
          document.getElementById('activeClientPhone').textContent = rideData.ride.client_phone || '--';
        }
      } catch (e) {
        console.log(e);
      }

      document.getElementById('activeClientName').textContent = 'Client #' + data.ride.client_id;
      document.getElementById('activeRidePrice').textContent = data.ride.price;
      document.getElementById('driverRideStatus').textContent = 'Acceptee';
      document.getElementById('btnStartRide').style.display = 'block';
      document.getElementById('btnCompleteRide').style.display = 'none';

      showScreen('driver-active');
    } else {
      alert('Erreur : ' + (data.error || 'inconnue'));
    }
  } catch (err) {
    console.error(err);
    alert('Impossible de contacter le serveur');
  }
}

// =============================================
// DEMARRER UNE COURSE
// =============================================
document.getElementById('btnStartRide').addEventListener('click', async () => {
  if (!currentDriverRide) return;

  try {
    const res = await fetch(API_URL + '/ride/' + currentDriverRide.id + '/start', {
      method: 'POST',
    });
    const data = await res.json();

    if (data.ok) {
      document.getElementById('driverRideStatus').textContent = 'En cours';
      document.getElementById('btnStartRide').style.display = 'none';
      document.getElementById('btnCompleteRide').style.display = 'block';
    }
  } catch (err) {
    console.error(err);
  }
});

// =============================================
// TERMINER UNE COURSE
// =============================================
document.getElementById('btnCompleteRide').addEventListener('click', async () => {
  if (!currentDriverRide) return;

  try {
    const res = await fetch(API_URL + '/ride/' + currentDriverRide.id + '/complete', {
      method: 'POST',
    });
    const data = await res.json();

    if (data.ok) {
      alert('Course terminee ! Bravo');
      currentDriverRide = null;
      showScreen('driver-home');
      loadAvailableRides();
      loadDriverStats();
    }
  } catch (err) {
    console.error(err);
  }
});

// =============================================
// AU DEMARRAGE
// =============================================
window.addEventListener('DOMContentLoaded', () => {
  const savedUser = localStorage.getItem('adedeta_user');
  const savedDriver = localStorage.getItem('adedeta_driver');

  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    document.getElementById('userName').textContent = currentUser.name;
    showScreen('order');
  } else if (savedDriver) {
    currentDriver = JSON.parse(savedDriver);
    document.getElementById('driverName').textContent = currentDriver.name;
    document.getElementById('switchToClient').classList.remove('active');
    document.getElementById('switchToDriver').classList.add('active');
    showScreen('driver-home');
    loadAvailableRides();
    loadDriverStats();
  } else {
    showScreen('register');
  }
});

console.log('ADEDETA frontend charge ! API:', API_URL);