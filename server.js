const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const CONFIG_PATH = path.join(__dirname, 'config.json');
const API_KEY = 'YOUR_API_KEY_HERE'; // Thay bằng API key thật

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Load config
function loadConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading config:', err);
    return {};
  }
}

// Save config
function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
}

// GET config
app.get('/config', (req, res) => {
  const config = loadConfig();
  // Không trả về API key cho frontend
  const safeConfig = { ...config };
  delete safeConfig.apiKey;
  res.json(safeConfig);
});

// POST config
app.post('/config', (req, res) => {
  try {
    const newConfig = req.body;
    saveConfig(newConfig);
    res.json({ success: true, message: 'Config saved!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save config' });
  }
});

// POST /create - Main logic
app.post('/create', async (req, res) => {
  const { url } = req.body;

  // Validate URL
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const config = loadConfig();
  const { message, title, alias, domain, buy_type, amount, apis } = config;

  try {
    // 1. Tạo note content
    const noteContent = message + '\n' + url;
    const noteApiUrl = `https://anonlink.co/note-api?api=${API_KEY}&content=${encodeURIComponent(noteContent)}&title=${encodeURIComponent(title)}&alias=${alias}&format=text`;

    const noteResponse = await fetch(noteApiUrl);
    if (!noteResponse.ok) throw new Error('Note API failed');
    const noteUrl = await noteResponse.text();

    // 2. Rút gọn link qua từng API trong danh sách
    const results = await Promise.all(
      apis.map(async (api) => {
        try {
          const shortApiUrl = `${api}?api=${API_KEY}&url=${encodeURIComponent(noteUrl)}&alias=${alias}&domain=${domain}&buy_type=${buy_type}&amount=${amount}&format=text`;
          const shortResponse = await fetch(shortApiUrl);
          if (!shortResponse.ok) throw new Error('Shorten API failed');
          return await shortResponse.text();
        } catch (err) {
          console.error(`Error with API ${api}:`, err);
          return 'ERROR';
        }
      })
    );

    // 3. Trả về kết quả
    res.json({
      note: noteUrl,
      results: results
    });

  } catch (err) {
    console.error('Error in /create:', err);
    res.status(500).json({ error: 'Failed to create links' });
  }
});

// URL validator
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
