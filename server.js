const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const pool = require('./src/db');

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
// SERVIR LE FRONTEND (HTML, CSS, JS)
// ============================================================
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ============================================================
// ROUTE DE TEST
// ============================================================
app.get('/api', (req, res) => {
  res.json({ message: 'ADEDETA API fonctionne !' });
});

// ============================================================
// TEST CONNEXION BASE DE DONNEES
// ============================================================
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ ok: true, time: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================================
// INSCRIPTION CLIENT
// ============================================================
app.post('/register', async (req, res) => {
  const { phone, name } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO users (phone, name) VALUES ($1, $2) RETURNING *',
      [phone, name]
    );
    res.json({ ok: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================================
// LISTE DES UTILISATEURS
// ============================================================
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY id DESC');
    res.json({ ok: true, users: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================================
// CONNEXION CLIENT
// ============================================================
app.post('/login', async (req, res) => {
  const { phone } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE phone = $1',
      [phone]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Utilisateur non trouve' });
    }
    res.json({ ok: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================================
// CREER UNE COURSE
// ============================================================
app.post('/ride/request', async (req, res) => {
  const { client_id, pickup, destination, price } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO rides (client_id, price, status) VALUES ($1, $2, $3) RETURNING *',
      [client_id, price, 'requested']
    );
    res.json({ ok: true, ride: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================================
// LISTE DES COURSES D'UN CLIENT
// ============================================================
app.get('/ride/client/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM rides WHERE client_id = $1 ORDER BY id DESC',
      [req.params.id]
    );
    res.json({ ok: true, rides: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================================
// LISTE DE TOUTES LES COURSES
// ============================================================
app.get('/rides', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rides ORDER BY id DESC');
    res.json({ ok: true, rides: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================================
// INSCRIPTION CONDUCTEUR
// ============================================================
app.post('/driver/register', async (req, res) => {
  const { name, phone, moto_plate } = req.body;
  try {
    const userResult = await pool.query(
      'INSERT INTO users (phone, name, role) VALUES ($1, $2, $3) RETURNING *',
      [phone, name, 'driver']
    );
    const user = userResult.rows[0];

    const driverResult = await pool.query(
      'INSERT INTO drivers (user_id, moto_plate, is_online, is_available) VALUES ($1, $2, $3, $4) RETURNING *',
      [user.id, moto_plate, true, true]
    );

    const driver = driverResult.rows[0];

    res.json({
      ok: true,
      driver: {
        id: driver.id,
        driver_id: driver.id,
        user_id: user.id,
        name: user.name,
        phone: user.phone,
        moto_plate: driver.moto_plate,
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================================
// CONNEXION CONDUCTEUR
// ============================================================
app.post('/driver/login', async (req, res) => {
  const { phone } = req.body;
  try {
    const result = await pool.query(
      "SELECT d.id as driver_id, d.moto_plate, d.total_rides, d.total_earnings, u.id as user_id, u.name, u.phone FROM drivers d JOIN users u ON u.id = d.user_id WHERE u.phone = $1 AND u.role = $2",
      [phone, 'driver']
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Conducteur non trouve' });
    }
    res.json({ ok: true, driver: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================================
// COURSES DISPONIBLES
// ============================================================
app.get('/rides/available', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT r.id, r.client_id, r.price, r.status, r.created_at, u.name as client_name, u.phone as client_phone FROM rides r JOIN users u ON u.id = r.client_id WHERE r.status = $1 ORDER BY r.id DESC",
      ['requested']
    );
    res.json({ ok: true, rides: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================================
// ACCEPTER UNE COURSE
// ============================================================
app.post('/ride/:id/accept', async (req, res) => {
  const { id } = req.params;
  const { driver_id } = req.body;
  try {
    const result = await pool.query(
      "UPDATE rides SET driver_id = $1, status = $2 WHERE id = $3 AND status = $4 RETURNING *",
      [driver_id, 'accepted', id, 'requested']
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Course deja prise' });
    }
    res.json({ ok: true, ride: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================================
// DEMARRER UNE COURSE
// ============================================================
app.post('/ride/:id/start', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE rides SET status = $1 WHERE id = $2 AND status = $3 RETURNING *",
      ['ongoing', id, 'accepted']
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Course non trouvee' });
    }
    res.json({ ok: true, ride: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================================
// TERMINER UNE COURSE
// ============================================================
app.post('/ride/:id/complete', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE rides SET status = $1 WHERE id = $2 AND status = $3 RETURNING *",
      ['completed', id, 'ongoing']
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Course non trouvee' });
    }

    const ride = result.rows[0];
    await pool.query(
      'UPDATE drivers SET total_rides = total_rides + 1, total_earnings = total_earnings + $1 WHERE id = $2',
      [ride.price, ride.driver_id]
    );

    res.json({ ok: true, ride: ride });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================================
// COURSES D'UN CONDUCTEUR
// ============================================================
app.get('/ride/driver/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT r.*, u.name as client_name, u.phone as client_phone FROM rides r JOIN users u ON u.id = r.client_id WHERE r.driver_id = $1 ORDER BY r.id DESC',
      [req.params.id]
    );
    res.json({ ok: true, rides: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================================
// STATUT D'UNE COURSE
// ============================================================
app.get('/ride/:id/status', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT r.*, u.name as driver_name, u.phone as driver_phone, d.moto_plate FROM rides r LEFT JOIN drivers d ON d.id = r.driver_id LEFT JOIN users u ON u.id = d.user_id WHERE r.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Course non trouvee' });
    }
    res.json({ ok: true, ride: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================================
// STATS CONDUCTEUR
// ============================================================
app.get('/driver/:id/stats', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT total_rides, total_earnings FROM drivers WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Conducteur non trouve' });
    }
    res.json({ ok: true, stats: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================================
// ROUTES ADMIN
// ============================================================
app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === 'adedeta2026') {
    res.json({ ok: true, message: 'Bienvenue Admin' });
  } else {
    res.status(401).json({ ok: false, error: 'Mot de passe incorrect' });
  }
});

app.get('/admin/stats', async (req, res) => {
  try {
    const usersCount = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'client'");
    const driversCount = await pool.query('SELECT COUNT(*) FROM drivers');
    const ridesCount = await pool.query('SELECT COUNT(*) FROM rides');
    const earningsResult = await pool.query("SELECT COALESCE(SUM(price), 0) as total FROM rides WHERE status = 'completed'");

    res.json({
      ok: true,
      stats: {
        clients: parseInt(usersCount.rows[0].count, 10),
        drivers: parseInt(driversCount.rows[0].count, 10),
        rides: parseInt(ridesCount.rows[0].count, 10),
        earnings: parseInt(earningsResult.rows[0].total, 10),
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/admin/clients', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, phone, name, role, created_at FROM users WHERE role = 'client' ORDER BY id DESC"
    );
    res.json({ ok: true, clients: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/admin/drivers', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT d.id as driver_id, d.moto_plate, d.total_rides, d.total_earnings, u.id as user_id, u.name, u.phone, u.created_at FROM drivers d JOIN users u ON u.id = d.user_id ORDER BY d.id DESC'
    );
    res.json({ ok: true, drivers: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/admin/rides', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT r.id, r.price, r.status, r.created_at, c.name as client_name, c.phone as client_phone, d.user_id as driver_user_id, du.name as driver_name, du.phone as driver_phone, dd.moto_plate FROM rides r LEFT JOIN users c ON c.id = r.client_id LEFT JOIN drivers dd ON dd.id = r.driver_id LEFT JOIN users du ON du.id = dd.user_id ORDER BY r.id DESC'
    );
    res.json({ ok: true, rides: result.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.delete('/admin/user/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM rides WHERE client_id = $1', [id]);
    await pool.query('UPDATE rides SET driver_id = NULL WHERE driver_id IN (SELECT id FROM drivers WHERE user_id = $1)', [id]);
    await pool.query('DELETE FROM drivers WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ ok: true, message: 'Utilisateur supprime' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================================
// DEMARRAGE
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Serveur ADEDETA demarre sur http://localhost:' + PORT);
  console.log('Frontend : http://localhost:' + PORT + '/index.html');
  console.log('Admin    : http://localhost:' + PORT + '/admin.html');
});