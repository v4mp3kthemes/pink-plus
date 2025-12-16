const express = require('express');
const { nanoid } = require('nanoid');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const DB_FILE = './db.json';
if (!fs.existsSync(DB_FILE))
  fs.writeFileSync(DB_FILE, JSON.stringify({ keys: [] }, null, 2));

function loadDB() {
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// VERIFY KEY
app.post('/verify', (req, res) => {
  const { key, hwid } = req.body;
  if (!key || !hwid) return res.json({ success: false });

  const db = loadDB();
  const entry = db.keys.find((k) => k.key === key);

  if (!entry) return res.json({ success: false });
  if (entry.banned) return res.json({ success: false });

  // HWID bind
  if (!entry.hwid) {
    entry.hwid = hwid;
    saveDB(db);
  }

  if (entry.hwid !== hwid) return res.json({ success: false });

  // expiration
  if (entry.expires && Date.now() > entry.expires) {
    return res.json({ success: false });
  }

  res.json({ success: true });
});

// GENERATE KEY (used by Discord bot)
app.post('/gen', (req, res) => {
  const { days } = req.body;

  const db = loadDB();
  const key = nanoid(20);

  db.keys.push({
    key,
    hwid: null,
    banned: false,
    expires: days ? Date.now() + days * 86400000 : null,
  });

  saveDB(db);
  res.json({ key });
});

app.post('/resethwid', (req, res) => {
  const { key } = req.body;
  const db = loadDB();

  const entry = db.keys.find((k) => k.key === key);
  if (!entry) return res.json({ success: false });

  entry.hwid = null;
  saveDB(db);

  res.json({ success: true });
});

app.listen(3000, () => console.log('API running on :3000'));
