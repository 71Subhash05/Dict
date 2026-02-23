const validRollNumbers = ['23481A5467','23481A5469','23481A5470','23481A5471','23481A5472','23481A5473','23481A5474','23481A5475','23481A5476','23481A5477','23481A5478','23481A5479','23481A5480','23481A5481','23481A5482','23481A5483','23481A5484','23481A5485','23481A5486','23481A5487','23481A5488','23481A5489','23481A5490','23481A5491','23481A5492','23481A5493','23481A5494','23481A5495','23481A5496','23481A5497','23481A5498','23481A5499','23481A54A0','23481A54A1','23481A54A2','23481A54A3','23481A54A4','23481A54A5','23481A54A6','23481A54A7','23481A54A8','23481A54B0','23481A54B1','23481A54B2','23481A54B3','23481A54B4','23481A54B5','23481A54B6','23481A54B7','23481A54B8','23481A54B9','24485A54C0','23481A54C1','23481A54C2','23481A54C3','23481A54C4','23481A54C5','23481A54C6','23481A54C7','23481A54C8','23481A54C9','23481A54D0','23481A54D1','24485A54D2','24485A5408','24485A5409','24485A5410','24485A5411','24485A5412','24485A5413'];

function initializeUsers() {
  if (!localStorage.getItem('users')) {
    const users = {};
    validRollNumbers.forEach(roll => {
      users[roll] = roll;
    });
    localStorage.setItem('users', JSON.stringify(users));
  }
  if (!localStorage.getItem('userStats')) {
    localStorage.setItem('userStats', JSON.stringify({}));
  }
  if (!localStorage.getItem('searchLogs')) {
    localStorage.setItem('searchLogs', JSON.stringify([]));
  }
}

function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  
  if (!username || !password) return showError('Fill all fields');
  if (!validRollNumbers.includes(username)) return showError('Invalid Roll Number');
  
  const users = JSON.parse(localStorage.getItem('users'));
  if (users[username] !== password) return showError('Incorrect Password');
  
  const stats = JSON.parse(localStorage.getItem('userStats'));
  if (!stats[username]) {
    stats[username] = { searches: 0, lastLogin: '', passwordChanges: 0 };
  }
  stats[username].lastLogin = new Date().toLocaleString();
  localStorage.setItem('userStats', JSON.stringify(stats));
  
  sessionStorage.setItem('currentUser', username);
  sessionStorage.setItem('loginTime', new Date().toLocaleString());
  location.href = 'home.html';
}

function adminLogin() {
  const pass = prompt('Enter Admin Password:');
  if (pass === 'BHARATHI') {
    sessionStorage.setItem('currentUser', 'ADMIN');
    location.href = 'admin.html';
  } else if (pass) {
    showError('Incorrect Admin Password');
  }
}

function showError(msg) {
  const errorMsg = document.getElementById('errorMsg');
  errorMsg.textContent = msg;
  errorMsg.style.display = 'block';
  setTimeout(() => errorMsg.style.display = 'none', 3000);
}

async function searchWord() {
  const word = document.getElementById('searchWord').value.trim().toLowerCase();
  if (!word) return alert('Enter a word');
  
  const loading = document.getElementById('loading');
  loading.style.display = 'block';
  
  try {
    // Get English dictionary data
    const dictResponse = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    const dictData = await dictResponse.json();
    
    if (dictData.title === 'No Definitions Found') {
      loading.style.display = 'none';
      return alert('Word not found');
    }
    
    const entry = dictData[0];
    const meaning = entry.meanings[0];
    const definition = meaning.definitions[0].definition;
    const synonyms = meaning.synonyms?.slice(0, 3).join(', ') || 'N/A';
    
    // Collect examples from dictionary
    let example1 = meaning.definitions[0].example || null;
    let example2 = meaning.definitions[1]?.example || null;
    
    // If examples not found, use Gemini API
    if (!example1 || !example2) {
      const geminiExamples = await getGeminiExamples(word);
      example1 = example1 || geminiExamples[0];
      example2 = example2 || geminiExamples[1];
    }
    
    // Translate to Telugu using Google Translate
    const translateWord = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=te&dt=t&q=${encodeURIComponent(word)}`);
    const wordTranslation = await translateWord.json();
    const teluguWord = wordTranslation[0][0][0];
    
    const translateMeaning = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=te&dt=t&q=${encodeURIComponent(definition)}`);
    const meaningTranslation = await translateMeaning.json();
    const teluguMeaning = meaningTranslation[0][0][0];
    
    const result = {
      teluguWord: teluguWord,
      teluguMeaning: teluguMeaning,
      englishMeaning: definition,
      synonyms: synonyms,
      useCase1: example1,
      useCase2: example2
    };
    
    displayResult(result, word);
    loading.style.display = 'none';
  } catch (error) {
    loading.style.display = 'none';
    alert('Error: ' + error.message);
  }
}

async function getGeminiExamples(word) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyCNaNFBkwjuECx7__S9U74qePphKhhrR2M`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `Provide exactly 2 example sentences using the word "${word}" in proper context. Write only the sentences, one per line, without numbering or extra text.` }]
        }]
      })
    });
    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text.trim();
    const lines = text.split('\n').map(l => l.trim().replace(/^[0-9]+[.)\s]+/, '')).filter(l => l.length > 0);
    return [
      lines[0] || `I need to check the ${word} before proceeding.`,
      lines[1] || `The ${word} was very helpful for my work.`
    ];
  } catch (error) {
    console.error('Gemini API error:', error);
    return [
      `I need to check the ${word} before proceeding.`,
      `The ${word} was very helpful for my work.`
    ];
  }
}

function parseAndDisplay(text, word) {
  const lines = text.split('\n').filter(l => l.trim());
  const result = {};
  
  lines.forEach(line => {
    const value = line.substring(line.indexOf(':') + 1).trim();
    if (line.includes('Telugu Word:')) result.teluguWord = value;
    if (line.includes('Telugu Meaning:')) result.teluguMeaning = value;
    if (line.includes('English Meaning:')) result.englishMeaning = value;
    if (line.includes('Synonyms:')) result.synonyms = value;
    if (line.includes('Use Case 1:')) result.useCase1 = value;
    if (line.includes('Use Case 2:')) result.useCase2 = value;
  });
  
  displayResult(result, word);
}

function displayResult(data, word) {
  document.getElementById('teluguWord').textContent = data.teluguWord || 'N/A';
  document.getElementById('teluguMeaning').textContent = data.teluguMeaning || 'N/A';
  document.getElementById('englishMeaning').textContent = data.englishMeaning || 'N/A';
  document.getElementById('synonyms').textContent = data.synonyms || 'N/A';
  document.getElementById('useCase1').textContent = data.useCase1 || 'N/A';
  document.getElementById('useCase2').textContent = data.useCase2 || 'N/A';
  document.getElementById('resultSection').style.display = 'block';
  
  saveSearchLog(word, data);
}

function saveSearchLog(word, data) {
  const logs = JSON.parse(localStorage.getItem('searchLogs'));
  const currentUser = sessionStorage.getItem('currentUser');
  
  logs.push({
    id: Date.now(),
    username: currentUser,
    word,
    teluguWord: data.teluguWord,
    teluguMeaning: data.teluguMeaning,
    englishMeaning: data.englishMeaning,
    synonyms: data.synonyms,
    useCase1: data.useCase1,
    useCase2: data.useCase2,
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString()
  });
  
  localStorage.setItem('searchLogs', JSON.stringify(logs));
  
  const stats = JSON.parse(localStorage.getItem('userStats'));
  if (!stats[currentUser]) stats[currentUser] = { searches: 0, lastLogin: '', passwordChanges: 0 };
  stats[currentUser].searches++;
  localStorage.setItem('userStats', JSON.stringify(stats));
}

function openStorage() {
  document.getElementById('storageModal').classList.add('show');
}

function verifyStorage() {
  const password = document.getElementById('storagePassword').value;
  const users = JSON.parse(localStorage.getItem('users'));
  const currentUser = sessionStorage.getItem('currentUser');
  
  if (users[currentUser] === password) {
    location.href = 'storage.html';
  } else {
    alert('Incorrect Password');
  }
}

function loadStorage() {
  const logs = JSON.parse(localStorage.getItem('searchLogs'));
  const currentUser = sessionStorage.getItem('currentUser');
  const tbody = document.getElementById('storageBody');
  
  const userLogs = currentUser === 'ADMIN' ? logs : logs.filter(l => l.username === currentUser);
  
  userLogs.forEach(log => {
    const row = tbody.insertRow();
    row.innerHTML = `
      <td>${log.username}</td>
      <td>${log.word}</td>
      <td>${log.teluguWord}</td>
      <td>${log.teluguMeaning}</td>
      <td>${log.englishMeaning}</td>
      <td>${log.synonyms}</td>
      <td>${log.useCase1}</td>
      <td>${log.useCase2}</td>
      <td>${log.date}</td>
      <td>${log.time}</td>
    `;
  });
}

function openChangePassword() {
  document.getElementById('changePasswordModal').classList.add('show');
}

function changePassword() {
  const oldPass = document.getElementById('oldPassword').value;
  const newPass = document.getElementById('newPassword').value;
  const confirmPass = document.getElementById('confirmPassword').value;
  
  const users = JSON.parse(localStorage.getItem('users'));
  const currentUser = sessionStorage.getItem('currentUser');
  
  if (users[currentUser] !== oldPass) return alert('Incorrect old password');
  if (newPass.length < 6) return alert('Password must be at least 6 characters');
  if (newPass !== confirmPass) return alert('Passwords do not match');
  
  users[currentUser] = newPass;
  localStorage.setItem('users', JSON.stringify(users));
  
  const stats = JSON.parse(localStorage.getItem('userStats'));
  if (!stats[currentUser]) stats[currentUser] = { searches: 0, lastLogin: '', passwordChanges: 0 };
  stats[currentUser].passwordChanges++;
  localStorage.setItem('userStats', JSON.stringify(stats));
  
  alert('Password changed successfully');
  closeModal('changePasswordModal');
}

function loadProfile() {
  const currentUser = sessionStorage.getItem('currentUser');
  const loginTime = sessionStorage.getItem('loginTime');
  const stats = JSON.parse(localStorage.getItem('userStats'));
  const logs = JSON.parse(localStorage.getItem('searchLogs'));
  
  const userLogs = logs.filter(l => l.username === currentUser);
  const lastSearch = userLogs.length > 0 ? userLogs[userLogs.length - 1].word : 'None';
  
  const userStat = stats[currentUser] || { searches: 0, passwordChanges: 0 };
  
  document.getElementById('rollNumber').textContent = currentUser;
  document.getElementById('loginTime').textContent = loginTime;
  document.getElementById('totalSearches').textContent = userStat.searches;
  document.getElementById('lastSearch').textContent = lastSearch;
  document.getElementById('passwordChanges').textContent = userStat.passwordChanges;
}

function showSection(section) {
  document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
  document.getElementById(section).style.display = 'block';
  
  if (section === 'users') loadUsers();
  if (section === 'logs') loadLogs();
}

function loadUsers() {
  const users = JSON.parse(localStorage.getItem('users'));
  const stats = JSON.parse(localStorage.getItem('userStats'));
  const tbody = document.getElementById('usersBody');
  tbody.innerHTML = '';
  
  for (let roll in users) {
    const userStat = stats[roll] || { searches: 0, lastLogin: 'Never' };
    const row = tbody.insertRow();
    row.innerHTML = `
      <td>${roll}</td>
      <td>${users[roll]}</td>
      <td>${userStat.searches}</td>
      <td>${userStat.lastLogin || 'Never'}</td>
      <td>
        <button onclick="editUser('${roll}')">Edit</button>
        <button onclick="deleteUser('${roll}')" class="danger-btn">Delete</button>
      </td>
    `;
  }
}

function addNewUser() {
  const roll = document.getElementById('newRollNumber').value.trim();
  const password = document.getElementById('newUserPassword').value;
  
  if (!roll || !password) return alert('Fill all fields');
  
  const users = JSON.parse(localStorage.getItem('users'));
  if (users[roll]) return alert('User already exists');
  
  users[roll] = password;
  localStorage.setItem('users', JSON.stringify(users));
  
  alert('User added successfully');
  document.getElementById('newRollNumber').value = '';
  document.getElementById('newUserPassword').value = '';
}

function editUser(roll) {
  const newPass = prompt('Enter new password for ' + roll);
  if (newPass) {
    const users = JSON.parse(localStorage.getItem('users'));
    users[roll] = newPass;
    localStorage.setItem('users', JSON.stringify(users));
    alert('Password updated');
    loadUsers();
  }
}

function deleteUser(roll) {
  if (confirm('Delete user ' + roll + '?')) {
    const users = JSON.parse(localStorage.getItem('users'));
    delete users[roll];
    localStorage.setItem('users', JSON.stringify(users));
    loadUsers();
  }
}

function loadLogs() {
  const logs = JSON.parse(localStorage.getItem('searchLogs'));
  const tbody = document.getElementById('logsBody');
  tbody.innerHTML = '';
  
  logs.forEach(log => {
    const row = tbody.insertRow();
    row.innerHTML = `
      <td>${log.username}</td>
      <td>${log.word}</td>
      <td>${log.teluguWord}</td>
      <td>${log.teluguMeaning}</td>
      <td>${log.englishMeaning}</td>
      <td>${log.synonyms}</td>
      <td>${log.useCase1}</td>
      <td>${log.useCase2}</td>
      <td>${log.date}</td>
      <td>${log.time}</td>
      <td><button onclick="deleteLog(${log.id})" class="danger-btn">Delete</button></td>
    `;
  });
}

function deleteLog(id) {
  if (confirm('Delete this log?')) {
    let logs = JSON.parse(localStorage.getItem('searchLogs'));
    logs = logs.filter(l => l.id !== id);
    localStorage.setItem('searchLogs', JSON.stringify(logs));
    loadLogs();
  }
}

function clearAllLogs() {
  if (confirm('Clear ALL logs? This cannot be undone!')) {
    localStorage.setItem('searchLogs', JSON.stringify([]));
    loadLogs();
  }
}

function closeModal(id) {
  document.getElementById(id).classList.remove('show');
}

document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop();
  
  if (page === 'login.html' || page === '') initializeUsers();
  
  if (!['login.html', 'index.html', ''].includes(page)) {
    if (!sessionStorage.getItem('currentUser')) location.href = 'login.html';
  }
  
  if (page === 'storage.html') loadStorage();
  if (page === 'profile.html') loadProfile();
  if (page === 'admin.html') loadUsers();
});
