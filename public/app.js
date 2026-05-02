// Tab switching
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  
  document.getElementById(tabName).classList.add('active');
  event.target.classList.add('active');
  
  if (tabName === 'config') loadConfig();
}

// Load config vào textarea
async function loadConfig() {
  try {
    const res = await fetch('/config');
    const config = await res.json();
    document.getElementById('configText').value = JSON.stringify(config, null, 2);
  } catch (err) {
    showStatus('Failed to load config', 'error');
  }
}

// Save config
async function saveConfig() {
  try {
    const configText = document.getElementById('configText').value;
    const config = JSON.parse(configText);
    
    const res = await fetch('/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    
    const data = await res.json();
    if (data.success) {
      showStatus('✅ Config saved successfully!', 'success');
    } else {
      showStatus('❌ Failed to save config', 'error');
    }
  } catch (err) {
    showStatus('❌ Invalid JSON format', 'error');
  }
}

function showStatus(message, type) {
  const status = document.getElementById('configStatus');
  status.textContent = message;
  status.className = type;
  setTimeout(() => status.textContent = '', 3000);
}

// Tạo links
async function createLinks() {
  const url = document.getElementById('urlInput').value.trim();
  const resultDiv = document.getElementById('result');
  const spinner = document.getElementById('spinner');
  const btn = document.getElementById('createBtn');

  if (!url) {
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<p class="error">Please enter a URL</p>';
    return;
  }

  // Show loading
  spinner.style.display = 'inline-block';
  btn.disabled = true;
  resultDiv.style.display = 'none';

  try {
    const res = await fetch('/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const data = await res.json();

    if (data.error) {
      resultDiv.innerHTML = `<p class="error">${data.error}</p>`;
    } else {
      let html = '<h3>📝 Note Link:</h3>';
      html += `<div class="result-item">
        <a href="${data.note}" target="_blank">${data.note}</a>
        <button class="copy-btn" onclick="copyToClipboard('${data.note}')">Copy</button>
      </div>`;
      
      html += '<h3>🔗 Shortened Links:</h3>';
      data.results.forEach((link, i) => {
        html += `<div class="result-item">
          <span>${link === 'ERROR' ? '<span class="error">ERROR</span>' : link}</span>
          ${link !== 'ERROR' ? `<button class="copy-btn" onclick="copyToClipboard('${link}')">Copy</button>` : ''}
        </div>`;
      });
      
      resultDiv.innerHTML = html;
    }
  } catch (err) {
    resultDiv.innerHTML = '<p class="error">Failed to create links</p>';
  } finally {
    spinner.style.display = 'none';
    btn.disabled = false;
    resultDiv.style.display = 'block';
  }
}

// Copy to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Copied!');
  });
}
